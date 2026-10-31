export default {
  "title": "Keyboard mastery",
  "summary": "Typing, Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+S and file shortcuts.",
  "steps": {
    "intro": {
      "title": "The keyboard is speed",
      "message": "The mouse is convenient, but keyboard shortcuts make work several times faster. In this chapter you press real keys in Notepad and with files. It is best done on a computer, not a phone."
    },
    "open-notepad": {
      "title": "Opening Notepad",
      "message": "To type text you need Notepad. Open it from the desktop icon.",
      "hints": [
        "Double-click the highlighted “Notepad” icon on the desktop."
      ],
      "wrong": {
        "single": "A single click only selects. Click twice quickly to open."
      }
    },
    "type-text": {
      "title": "Typing text",
      "message": "Click in the text area and type any sentence (at least 12 characters), for example: “Hello, world!”.",
      "hints": [
        "Click the text area and type."
      ],
      "wrong": {
        "check": "The text is too short. Type at least 12 characters."
      }
    },
    "select-all": {
      "title": "Select all: Ctrl+A",
      "message": "Before copying or deleting, text has to be selected. Ctrl+A selects everything at once.",
      "hints": [
        "With the cursor in the text area, press Ctrl and A together."
      ],
      "wrong": {
        "check": "The text is not selected. Press Ctrl+A inside the text area."
      }
    },
    "copy-text": {
      "title": "Copy: Ctrl+C",
      "message": "The selected text is highlighted. Ctrl+C copies it to memory. Nothing changes on screen — the copy goes into the invisible “clipboard”.",
      "hints": [
        "With the text selected, press Ctrl and C together."
      ],
      "wrong": {
        "check": "The whole text was not copied. Press Ctrl+A first, then Ctrl+C."
      }
    },
    "paste-text": {
      "title": "Paste: Ctrl+V",
      "message": "Right now all text is selected, so pasting would replace it. First press → (right arrow): the selection clears and the cursor jumps to the end. Then press Ctrl+V — the text appears twice.",
      "hints": [
        "First →, then Ctrl+V.",
        "The text should now appear twice."
      ],
      "wrong": {
        "check": "The text did not double. If anything is selected, pasting replaces it. Press → and try Ctrl+V again."
      }
    },
    "undo": {
      "title": "Undo: Ctrl+Z",
      "message": "Made a mistake? Ctrl+Z undoes the last action. Undo the paste so the text appears once.",
      "hints": [
        "Press Ctrl and Z together."
      ],
      "wrong": {
        "check": "The text is still doubled. Press Ctrl+Z once more."
      }
    },
    "cut-text": {
      "title": "Cut: Ctrl+X",
      "message": "Cut is copy and delete in one. Select everything first (Ctrl+A), then press Ctrl+X: the text disappears but stays in memory.",
      "hints": [
        "Ctrl+A, then Ctrl+X."
      ],
      "wrong": {
        "check": "The text is still there. Select everything with Ctrl+A, then Ctrl+X."
      }
    },
    "paste-back": {
      "title": "Bringing the text back",
      "message": "The text is not lost — it is on the clipboard. Put it back with Ctrl+V.",
      "hints": [
        "Press Ctrl+V."
      ],
      "wrong": {
        "check": "The text did not come back. With the cursor in the area, press Ctrl+V."
      }
    },
    "save-shortcut": {
      "title": "Save: Ctrl+S",
      "message": "Unsaved work can be lost. Press Ctrl+S, give it a name (for example Note-2.txt), choose a folder and save.",
      "hints": [
        "Press Ctrl and S together.",
        "In the window, type a name and click “Save”."
      ],
      "wrong": {
        "check": "The file was not saved. Check the name (no forbidden characters or taken names)."
      }
    },
    "close-notes": {
      "title": "Closing Notepad",
      "message": "Now let’s practise file shortcuts. Close the Notepad window.",
      "hints": [
        "Click the close (×) button in the top-right corner of the window."
      ]
    },
    "open-documents": {
      "title": "Opening Documents",
      "message": "Open the “Documents” folder.",
      "hints": [
        "Double-click the “Documents” icon on the desktop."
      ],
      "wrong": {
        "single": "A single click only selects. Click twice quickly."
      }
    },
    "select-file": {
      "title": "Selecting a file",
      "message": "Click “Eslatma.txt” once to select it.",
      "hints": [
        "Click the highlighted “Eslatma.txt” in the list."
      ]
    },
    "key-copy": {
      "title": "Copy the file: Ctrl+C",
      "message": "The same keys work for files. Copy the selected file with Ctrl+C (the keyboard, not the button!).",
      "hints": [
        "With the file selected, press Ctrl and C together."
      ],
      "wrong": {
        "mouse": "This time copy with the keyboard: Ctrl+C, not the button."
      }
    },
    "go-downloads": {
      "title": "Going to Downloads",
      "message": "In the left panel, open the “Downloads” folder.",
      "hints": [
        "Click the highlighted “Downloads” on the left."
      ]
    },
    "key-paste": {
      "title": "Paste: Ctrl+V",
      "message": "Paste the copy into this folder with Ctrl+V.",
      "hints": [
        "Press Ctrl and V together."
      ],
      "wrong": {
        "mouse": "This time paste with the keyboard: Ctrl+V."
      }
    },
    "key-delete": {
      "title": "Delete: Delete",
      "message": "The pasted copy is selected. The Delete key sends it to the Recycle Bin — just like on a real computer.",
      "hints": [
        "With the file selected, press the Delete key.",
        "If it is not selected, click it first."
      ],
      "wrong": {
        "mouse": "This time delete with the Delete key on the keyboard."
      }
    },
    "finish": {
      "title": "Chapter three complete",
      "message": "You used Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+S and Delete. They work in almost every program. Note: Alt+Tab (switching windows) and switching the input language cannot be practised in a browser — try them on your real computer."
    }
  }
};
