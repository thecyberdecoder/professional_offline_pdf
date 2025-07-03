import sys
import subprocess
import os

def compress_pdf(input_path, output_path, quality):
    """
    Compresses a PDF file using Ghostscript.

    Args:
        input_path (str): Path to the input PDF file.
        output_path (str): Path to save the compressed PDF file.
        quality (str): Compression quality ('low', 'medium', 'high').
                       Maps to Ghostscript settings:
                       'low' -> /screen (72 dpi)
                       'medium' -> /ebook (150 dpi)
                       'high' -> /printer (300 dpi)
    """
    gs_settings = {
        'low': '/screen',
        'medium': '/ebook',
        'high': '/printer'
    }

    if quality not in gs_settings:
        print(f"Error: Invalid quality setting '{quality}'. Must be 'low', 'medium', or 'high'.", file=sys.stderr)
        sys.exit(1)

    # Construct the Ghostscript command
    # -sDEVICE=pdfwrite: Output to PDF
    # -dCompatibilityLevel=1.4: PDF version
    # -dPDFSETTINGS=...: Compression setting
    # -dNOPAUSE -dBATCH: Run without user interaction
    # -sOutputFile=...: Output file path
    # input_path: Input file path
    command = [
        'gswin64.exe',
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        f'-dPDFSETTINGS={gs_settings[quality]}',
        '-dNOPAUSE',
        '-dBATCH',
        f'-sOutputFile={output_path}',
        input_path
    ]

    try:
        # Execute the Ghostscript command
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        sys.stdout.write("Ghostscript stdout:\n" + result.stdout + "\n")
        sys.stderr.write("Ghostscript stderr:\n" + result.stderr + "\n")
        print(f"PDF compressed successfully to {output_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error during Ghostscript execution:", file=sys.stderr)
        print(f"Command: {' '.join(e.cmd)}", file=sys.stderr)
        print(f"Return Code: {e.returncode}", file=sys.stderr)
        print(f"Stdout: {e.stdout}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print("Error: Ghostscript (gs) command not found.", file=sys.stderr)
        print("Please ensure Ghostscript is installed and accessible in your system's PATH.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python compress_pdf.py <input_pdf_path> <output_pdf_path> <quality>", file=sys.stderr)
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    quality_setting = sys.argv[3]

    compress_pdf(input_pdf, output_pdf, quality_setting)
