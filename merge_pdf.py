import sys
import os
from PyPDF2 import PdfMerger

def merge_pdfs(input_paths, output_path):
    """
    Merges multiple PDF files into a single PDF.

    Args:
        input_paths (list): A list of paths to the input PDF files.
        output_path (str): Path to save the merged PDF file.
    """
    merger = PdfMerger()
    try:
        for path in input_paths:
            if not os.path.exists(path):
                print(f"Error: Input file not found: {path}", file=sys.stderr)
                sys.exit(1)
            merger.append(path)
        merger.write(output_path)
        merger.close()
        print(f"PDFs merged successfully to {output_path}")
    except Exception as e:
        print(f"Error merging PDFs: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python merge_pdf.py <output_pdf_path> <input_pdf_path_1> [input_pdf_path_2 ...]", file=sys.stderr)
        sys.exit(1)

    output_pdf = sys.argv[1]
    input_pdfs = sys.argv[2:]

    merge_pdfs(input_pdfs, output_pdf)
