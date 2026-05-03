import fitz
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

pdfs = [
    r'd:\leoned\backend\LeonEd Africa.pdf',
    r'd:\leoned\backend\leoned_africa_advanced_prd.pdf',
    r'd:\leoned\backend\LeonEd Africa 3 Month Delivery Milestones.pdf'
]

for pdf_path in pdfs:
    print(f"\n{'='*80}")
    print(f"FILE: {os.path.basename(pdf_path)}")
    print(f"{'='*80}\n")
    doc = fitz.open(pdf_path)
    for page in doc:
        print(page.get_text())
    doc.close()
