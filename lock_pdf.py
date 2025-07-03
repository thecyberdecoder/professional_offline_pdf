import sys
import os
from PyPDF2 import PdfReader, PdfWriter

def lock_pdf(input_path, output_path, password):
    """
    Encrypts a PDF file with a password.

    Args:
        input_path (str): Path to the input PDF file.
        output_path (str): Path to save the encrypted PDF file.
        password (str): The password to encrypt the PDF with.
    """
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        # Add all pages to the writer
        for page in reader.pages:
            writer.add_page(page)

        # Encrypt the PDF
        writer.encrypt(user_password=password, owner_password=None, permissions_flag=1)

        # Write the encrypted PDF to the output file
        with open(output_path, "wb") as f:
            writer.write(f)

        print(f"PDF locked successfully to {output_path}")
    except Exception as e:
        print(f"Error locking PDF: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python lock_pdf.py <input_pdf_path> <output_pdf_path> <password>", file=sys.stderr)
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    pdf_password = sys.argv[3]

    lock_pdf(input_pdf, output_pdf, pdf_password)
