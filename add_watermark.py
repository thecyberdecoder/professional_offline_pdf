import sys
import os
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color

def add_watermark(input_path, output_path, text, font_size, r, g, b, opacity, position):
    """
    Adds a text watermark to a PDF file.

    Args:
        input_path (str): Path to the input PDF file.
        output_path (str): Path to save the watermarked PDF file.
        text (str): The watermark text.
        font_size (int): Font size of the watermark text.
        r (float): Red component of the color (0-1).
        g (float): Green component of the color (0-1).
        b (float): Blue component of the color (0-1).
        opacity (float): Opacity of the watermark (0-1).
        position (str): Position of the watermark ('diagonal' or 'center').
    """
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        # Create a new PDF for the watermark
        watermark_path = "./uploads/watermark_temp.pdf"
        c = canvas.Canvas(watermark_path, pagesize=letter)
        c.setFont("Helvetica", font_size)
        
        # Set color with opacity
        fill_color = Color(r, g, b, alpha=opacity)
        c.setFillColor(fill_color)

        # Get page dimensions for positioning
        page_width, page_height = letter

        if position == 'diagonal':
            # Rotate watermark for diagonal effect
            c.translate(page_width / 2, page_height / 2)
            c.rotate(45) # Rotate by 45 degrees
            c.drawCentredString(0, 0, text)
        elif position == 'center':
            # Position watermark in the center without rotation
            text_width = c.stringWidth(text, "Helvetica", font_size)
            c.drawCentredString(page_width / 2, page_height / 2, text)
        else:
            print(f"Error: Invalid watermark position '{position}'. Must be 'diagonal' or 'center'.", file=sys.stderr)
            sys.exit(1)
        
        c.save()

        watermark_reader = PdfReader(watermark_path)
        watermark_page = watermark_reader.pages[0]

        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            page.merge_page(watermark_page)
            writer.add_page(page)

        with open(output_path, "wb") as f:
            writer.write(f)

        os.remove(watermark_path) # Clean up temporary watermark file
        print(f"PDF watermarked successfully to {output_path}")

    except Exception as e:
        print(f"Error adding watermark: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 10:
        print("Usage: python add_watermark.py <input_pdf> <output_pdf> <text> <font_size> <r> <g> <b> <opacity> <position>", file=sys.stderr)
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    text = sys.argv[3]
    font_size = int(sys.argv[4])
    r = float(sys.argv[5])
    g = float(sys.argv[6])
    b = float(sys.argv[7])
    opacity = float(sys.argv[8])
    position = sys.argv[9]

    add_watermark(input_pdf, output_pdf, text, font_size, r, g, b, opacity, position)
