import sys
import os
from PyPDF2 import PdfReader, PdfWriter

def unlock_pdf(input_path, output_path, password):
    """
    Decrypts a password-protected PDF file.

    Args:
        input_path (str): Path to the input PDF file.
        output_path (str): Path to save the decrypted PDF file.
        password (str): The password to decrypt the PDF with.
    """
    try:
        reader = PdfReader(input_path)

        if reader.is_encrypted:
            if not reader.decrypt(password):
                print("Error: Incorrect password.", file=sys.stderr)
                sys.exit(1)

        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)

        with open(output_path, "wb") as f:
            writer.write(f)

        print(f"PDF unlocked successfully to {output_path}")
    except Exception as e:
        print(f"Error unlocking PDF: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python unlock_pdf.py <input_pdf_path> <output_pdf_path> <password>", file=sys.stderr)
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    pdf_password = sys.argv[3]

    unlock_pdf(input_pdf, output_pdf, pdf_password)
