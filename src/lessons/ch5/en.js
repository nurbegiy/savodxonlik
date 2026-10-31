export default {
  "title": "Creating a document",
  "summary": "Write a document, save it with a name into a folder, find it, reopen it, edit it and save again.",
  "steps": {
    "intro": {
      "title": "Your own document",
      "message": "Creating a document means writing it, naming it and saving it in the right place. Type the name and location exactly: “Mening hujjatim.txt”, folder “Documents”."
    },
    "open-notepad": {
      "title": "Opening Notepad",
      "message": "Double-click the “Notepad” icon on the desktop.",
      "hints": [
        "Double-click the highlighted “Notepad” icon."
      ],
      "wrong": {
        "single": "A single click only selects. Click twice quickly."
      }
    },
    "write-doc": {
      "title": "The document text",
      "message": "Write at least three lines (Enter starts a new line), at least 30 characters in total. For example: goal, plan, result.",
      "hints": [
        "Click the text area, type, and press Enter between lines."
      ],
      "wrong": {
        "check": "You need at least three lines and 30 characters. Write some more."
      }
    },
    "save-doc": {
      "title": "Saving with a name",
      "message": "Click Save (or press Ctrl+S). Name: “Mening hujjatim.txt”, folder: “Documents”. Then click “Save”.",
      "hints": [
        "Click the highlighted “Save” button.",
        "Type Mening hujjatim.txt as the name and keep the folder “Documents”."
      ],
      "wrong": {
        "name": "The name or folder differs. The name must be exactly “Mening hujjatim.txt” and the folder “Documents”. If you already saved under another name, use the “Save as” button.",
        "check": "The file was not found. Check the name and folder."
      }
    },
    "close-notepad": {
      "title": "Closing Notepad",
      "message": "The document is saved. Close Notepad — the file will not disappear.",
      "hints": [
        "Click the close (×) button."
      ]
    },
    "open-documents": {
      "title": "The Documents folder",
      "message": "We look for the file where we saved it. Open “Documents”.",
      "hints": [
        "Double-click the “Documents” icon."
      ],
      "wrong": {
        "single": "A single click only selects. Click twice quickly."
      }
    },
    "select-file": {
      "title": "Finding the file",
      "message": "Find “Mening hujjatim.txt” in the list and click it once.",
      "hints": [
        "Click the highlighted file."
      ]
    },
    "open-file": {
      "title": "Opening the file",
      "message": "To open a file, double-click it — it opens in Notepad.",
      "hints": [
        "Double-click the file."
      ]
    },
    "edit-doc": {
      "title": "Editing",
      "message": "Add a new line at the end: “Hujjat tayyor”. Go to the end of the text and type.",
      "hints": [
        "Click in the text, press Ctrl+End to jump to the end, press Enter and type: Hujjat tayyor."
      ],
      "wrong": {
        "check": "The word “tayyor” was not found in the text."
      }
    },
    "save-edit": {
      "title": "Saving the change",
      "message": "You changed the file, but without saving it is lost. Press Ctrl+S or click “Save”. The file already has a name, so it will not ask.",
      "hints": [
        "Ctrl+S or the “Save” button."
      ]
    },
    "close-notepad2": {
      "title": "Closing Notepad",
      "message": "Close Notepad.",
      "hints": [
        "Click the close (×) button."
      ]
    },
    "reopen-file": {
      "title": "Reopen and check",
      "message": "Open the file again: the “tayyor” line has been kept.",
      "hints": [
        "Double-click “Mening hujjatim.txt”."
      ]
    },
    "finish": {
      "title": "Chapter five complete",
      "message": "You wrote a document, saved it with a name in a folder, found and reopened it, edited it and saved again. On a real computer you would usually use Word instead of Notepad, but the routine is the same. Note: formatting and the “unsaved changes” warning come in later chapters or on your real computer."
    }
  }
};
