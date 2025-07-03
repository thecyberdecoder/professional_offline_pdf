require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { PDFDocument, degrees, rgb, StandardFonts } = require('pdf-lib');
const cors = require('cors');
const fs = require('fs').promises;
const docx = require('docx-pdf');
const { exec } = require('child_process');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 3001;

const uploadDir = './uploads';

// Create the uploads directory if it doesn't exist
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

app.use(cors());
app.use(express.json()); // Enable JSON body parsing
app.use(express.static('../client/public')); // Serve static files from the client/public directory

const storage = multer.memoryStorage();
const upload = multer({ storage });

// In-memory user store (for demonstration purposes)
const users = [
  { username: 'aps@aps.com', passwordHash: bcrypt.hashSync('82201', 10), role: 'admin' }
];

// Secret for JWT
const JWT_SECRET = 'a_very_secret_key';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware to check for admin role
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.sendStatus(403);
  }
  next();
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  if (users.find(u => u.username === username)) {
    return res.status(409).send('User already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash, role: 'user' }); // New users are 'user' role by default
  res.status(201).send('User registered successfully.');
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (user == null) {
    return res.status(400).send('Cannot find user.');
  }

  if (await bcrypt.compare(password, user.passwordHash)) {
    const accessToken = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET);
    res.json({ accessToken });
  } else {
    res.status(401).send('Invalid credentials.');
  }
});

// Admin routes
app.post('/api/admin/add-user', authenticateToken, authorizeAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  if (users.find(u => u.username === username)) {
    return res.status(409).send('User already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash, role: role || 'user' });
  res.status(201).send('User added successfully.');
});

app.get('/api/admin/users', authenticateToken, authorizeAdmin, (req, res) => {
  res.json(users.map(u => ({ username: u.username, role: u.role })));
});


app.post('/api/merge', upload.array('files'), authenticateToken, async (req, res) => {
  const tempFilePaths = [];
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).send('Please upload at least two PDF files to merge.');
    }

    // Save uploaded files to temporary locations
    for (const file of req.files) {
      const tempPath = `./uploads/${Date.now()}_${file.originalname}`;
      await fs.writeFile(tempPath, file.buffer);
      tempFilePaths.push(tempPath);
    }

    const outputFilePath = `./uploads/${Date.now()}_merged.pdf`;

    // Execute the Python script for merging
    const pythonCommand = `python merge_pdf.py "${outputFilePath}" ${tempFilePaths.map(p => `"${p}"`).join(' ')}`;

    exec(pythonCommand, async (error, stdout, stderr) => {
      // Clean up temporary input files regardless of success or failure
      for (const path of tempFilePaths) {
        await fs.unlink(path).catch(err => console.error(`Error deleting temp file ${path}:`, err));
      }

      if (error) {
        console.error(`Python script error: ${error}`);
        console.error(`Python script stderr: ${stderr}`);
        await fs.unlink(outputFilePath).catch(() => {}); // outputFilePath may not exist
        return res.status(500).send(`Error merging PDFs: ${stderr}`);
      }
      console.log(`Python script stdout: ${stdout}`);
      console.error(`Python script stderr: ${stderr}`);

      const mergedPdfBytes = await fs.readFile(outputFilePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(mergedPdfBytes);

      // Clean up the merged output file
      await fs.unlink(outputFilePath);
    });
  } catch (error) {
    console.error(error);
    // Clean up any files that might have been written before the error
    for (const path of tempFilePaths) {
      await fs.unlink(path).catch(err => console.error(`Error deleting temp file ${path}:`, err));
    }
    res.status(500).send('Error merging PDFs');
  }
});

app.post('/api/split', upload.single('file'), authenticateToken, async (req, res) => {
    try {
        const { pages } = req.body; 
        const selectedPages = JSON.parse(pages); // Parse the JSON string back to an array

        const pdf = await PDFDocument.load(req.file.buffer);
        const newPdf = await PDFDocument.create();
        
        for (const pageNum of selectedPages) {
            if (pageNum >= 1 && pageNum <= pdf.getPageCount()) {
                const [copiedPage] = await newPdf.copyPages(pdf, [pageNum - 1]);
                newPdf.addPage(copiedPage);
            }
        }

        const pdfBytes = await newPdf.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error splitting PDF');
    }
});

app.post('/api/compress', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    const { quality } = req.body; // 'quality' instead of 'compressionLevel'
    const inputPath = `./uploads/${Date.now()}_input.pdf`;
    const outputPath = `./uploads/${Date.now()}_compressed.pdf`;

    await fs.writeFile(inputPath, req.file.buffer);

    // Execute the Python script for compression
    const pythonCommand = `python compress_pdf.py "${inputPath}" "${outputPath}" "${quality}"`;

    exec(pythonCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Python script error: ${error}`);
        console.error(`Python script stderr: ${stderr}`);
        await fs.unlink(inputPath);
        await fs.unlink(outputPath).catch(() => {}); // outputPath may not exist
        return res.status(500).send(`Error compressing PDF: ${stderr}`);
      }
      console.log(`Python script stdout: ${stdout}`);
      console.error(`Python script stderr: ${stderr}`); // Ghostscript errors might appear here

      const compressedPdfBytes = await fs.readFile(outputPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(compressedPdfBytes);

      // Clean up temporary files
      await fs.unlink(inputPath);
      await fs.unlink(outputPath);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error compressing PDF');
  }
});

app.post('/api/rotate', upload.single('file'), authenticateToken, async (req, res) => {
    try {
        const { rotation } = req.body;
        const pdf = await PDFDocument.load(req.file.buffer);
        const pages = pdf.getPages();
        pages.forEach(page => {
            page.setRotation(degrees(parseInt(rotation, 10)));
        });
        const pdfBytes = await pdf.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error rotating PDF');
    }
});

app.post('/api/jpg-to-pdf', upload.array('files'), authenticateToken, async (req, res) => {
    try {
        const newPdf = await PDFDocument.create();
        for (const file of req.files) {
            const image = await newPdf.embedJpg(file.buffer);
            const page = newPdf.addPage();
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: page.getWidth(),
                height: page.getHeight(),
            });
        }
        const pdfBytes = await newPdf.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error converting JPG to PDF');
    }
});

app.post('/api/add-watermark', upload.single('file'), authenticateToken, async (req, res) => {
  const tempFilePaths = [];
  try {
    if (!req.file) {
      return res.status(400).send('Please upload a PDF file to add a watermark.');
    }
    const { text, fontSize, color, opacity } = req.body;
    if (!text || !fontSize || !color || opacity === undefined) {
      return res.status(400).send('Watermark text, font size, color, and opacity are required.');
    }

    // Convert hex color to RGB components (0-1 range)
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;

    const inputPath = `./uploads/${Date.now()}_input.pdf`;
    const outputPath = `./uploads/${Date.now()}_watermarked.pdf`;

    await fs.writeFile(inputPath, req.file.buffer);
    tempFilePaths.push(inputPath);

    // Execute the Python script for adding watermark
    const pythonCommand = `python add_watermark.py "${inputPath}" "${outputPath}" "${text}" ${fontSize} ${r} ${g} ${b} ${opacity} "${watermarkPosition}"`;

    exec(pythonCommand, async (error, stdout, stderr) => {
      // Clean up temporary input file regardless of success or failure
      for (const path of tempFilePaths) {
        await fs.unlink(path).catch(err => console.error(`Error deleting temp file ${path}:`, err));
      }

      if (error) {
        console.error(`Python script error: ${error}`);
        console.error(`Python script stderr: ${stderr}`);
        await fs.unlink(outputPath).catch(() => {}); // outputPath may not exist
        return res.status(500).send(`Error adding watermark: ${stderr}`);
      }
      console.log(`Python script stdout: ${stdout}`);
      console.error(`Python script stderr: ${stderr}`);

      const watermarkedPdfBytes = await fs.readFile(outputPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(watermarkedPdfBytes);

      // Clean up the watermarked output file
      await fs.unlink(outputPath);
    });
  } catch (error) {
    console.error(error);
    // Clean up any files that might have been written before the error
    for (const path of tempFilePaths) {
      await fs.unlink(path).catch(err => console.error(`Error deleting temp file ${path}:`, err));
    }
    res.status(500).send('Error adding watermark');
  }
});

app.post('/api/add-page-numbers', upload.single('file'), authenticateToken, async (req, res) => {
    try {
        const pdfDoc = await PDFDocument.load(req.file.buffer);
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        for (let i = 0; i < pages.length; i++) {
            pages[i].drawText(`${i + 1}` , {
                x: pages[i].getWidth() / 2,
                y: 20,
                font,
                size: 12,
            });
        }

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding page numbers');
    }
});

app.post('/api/lock', upload.single('file'), authenticateToken, async (req, res) => {
  const tempFilePaths = [];
  try {
    if (!req.file) {
      return res.status(400).send('Please upload a PDF file to lock.');
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).send('Password is required to lock the PDF.');
    }

    const inputPath = `./uploads/${Date.now()}_input.pdf`;
    const outputPath = `./uploads/${Date.now()}_locked.pdf`;

    await fs.writeFile(inputPath, req.file.buffer);
    tempFilePaths.push(inputPath);

    // Execute the Python script for locking
    const pythonCommand = `python lock_pdf.py "${inputPath}" "${outputPath}" "${password}"`;

    exec(pythonCommand, async (error, stdout, stderr) => {
      // Clean up temporary input file regardless of success or failure
      for (const path of tempFilePaths) {
        await fs.unlink(path).catch(err => console.error(`Error deleting temp file ${path}:`, err));
      }

      if (error) {
        console.error(`Python script error: ${error}`);
        console.error(`Python script stderr: ${stderr}`);
        await fs.unlink(outputPath).catch(() => {}); // outputPath may not exist
        return res.status(500).send(`Error locking PDF: ${stderr}`);
      }
      console.log(`Python script stdout: ${stdout}`);
      console.error(`Python script stderr: ${stderr}`);

      const lockedPdfBytes = await fs.readFile(outputPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(lockedPdfBytes);

      // Clean up the locked output file
      await fs.unlink(outputPath);
    });
  } catch (error) {
    console.error(error);
    // Clean up any files that might have been written before the error
    for (const path of tempFilePaths) {
      await fs.unlink(path).catch(err => console.error(`Error deleting temp file ${path}:`, err));
    }
    res.status(500).send('Error locking PDF');
  }
});

app.post('/api/unlock', upload.single('file'), authenticateToken, async (req, res) => {
  const tempFilePaths = [];
  try {
    if (!req.file) {
      return res.status(400).send('Please upload a PDF file to unlock.');
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).send('Password is required to unlock the PDF.');
    }

    const inputPath = `./uploads/${Date.now()}_input.pdf`;
    const outputPath = `./uploads/${Date.now()}_unlocked.pdf`;

    await fs.writeFile(inputPath, req.file.buffer);
    tempFilePaths.push(inputPath);

    // Execute the Python script for unlocking
    const pythonCommand = `python unlock_pdf.py "${inputPath}" "${outputPath}" "${password}"`;

    exec(pythonCommand, async (error, stdout, stderr) => {
      // Clean up temporary input file regardless of success or failure
      for (const path of tempFilePaths) {
        await fs.unlink(path).catch(err => console.error(`Error deleting temp file ${path}:`, err));
      }

      if (error) {
        console.error(`Python script error: ${error}`);
        console.error(`Python script stderr: ${stderr}`);
        await fs.unlink(outputPath).catch(() => {}); // outputPath may not exist
        return res.status(500).send(`Error unlocking PDF: ${stderr}`);
      }
      console.log(`Python script stdout: ${stdout}`);
      console.error(`Python script stderr: ${stderr}`);

      const unlockedPdfBytes = await fs.readFile(outputPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(unlockedPdfBytes);

      // Clean up the unlocked output file
      await fs.unlink(outputPath);
    });
  } catch (error) {
    console.error(error);
    // Clean up any files that might have been written before the error
    for (const path of tempFilePaths) {
      await fs.unlink(path).catch(err => console.error(`Error deleting temp file ${path}:`, err));
    }
    res.status(500).send('Error unlocking PDF');
  }
});

app.post('/api/word-to-pdf', upload.single('file'), (req, res) => {
    try {
        const outputFilePath = Date.now() + '.pdf';
        docx(req.file.buffer, outputFilePath, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error converting Word to PDF');
            }
            res.download(outputFilePath, (err) => {
                if (err) {
                    console.error(err);
                }
                fs.unlinkSync(outputFilePath);
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error converting Word to PDF');
    }
});

const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});