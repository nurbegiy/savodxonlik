export default {
  title: "Files and order",
  summary: "Create a folder, copy a file, rename it, delete it, restore it and find it by search.",
  steps: {
    intro: {
      title: "Order is speed",
      message: "When files are kept tidy you can find a document in seconds. In this chapter you perform real operations: create a folder, copy, delete and restore. File and folder names (Loyiha, Hisobot.txt) must be typed exactly as shown.",
    },
    "open-documents": {
      title: "Opening Documents",
      message: "Our files live in the “Documents” folder. Open it by double-clicking its icon.",
      hints: ["Double-click the highlighted “Documents” icon on the desktop."],
      wrong: { single: "A single click only selects. Click twice quickly to open." },
    },
    "new-folder": {
      title: "A new folder",
      message: "A folder is a box for related files. The “New folder” button at the top creates an empty one.",
      hints: ["Click the highlighted “New folder” button at the top of the window."],
    },
    "name-folder": {
      title: "Naming the folder",
      message: "The folder name is being edited. Give it a name that describes its contents: type “Loyiha” and press Enter.",
      hints: ["Type Loyiha in the name box (capital L).", "Then press the Enter key."],
      wrong: {
        name: "For this exercise the folder must be named exactly “Loyiha”. Select the folder, click “Rename” and type it again.",
        check: "No folder called “Loyiha” was found. Check the name and try again.",
      },
    },
    "open-folder": {
      title: "Going into the folder",
      message: "Open the new folder to see what is inside. For now it is empty.",
      hints: ["Double-click the “Loyiha” folder."],
    },
    "go-up": {
      title: "One level up",
      message: "The up arrow (↑) button takes you to the parent folder. The Back button works too.",
      hints: ["Click the highlighted ↑ button at the top."],
    },
    "select-file": {
      title: "Selecting a file",
      message: "Before acting on a file you select it. Click “Hisobot.txt” once.",
      hints: ["Click once on “Hisobot.txt” in the list."],
    },
    "copy-file": {
      title: "Copying",
      message: "“Copy” places the file on the clipboard but leaves it where it is. The clipboard is a temporary pocket.",
      hints: ["Click the highlighted “Copy” button at the top.", "Select the file first if needed."],
    },
    "enter-folder": {
      title: "Going to the destination",
      message: "The copy is waiting on the clipboard. Now go to where you want to place it: the “Loyiha” folder.",
      hints: ["Double-click the “Loyiha” folder."],
    },
    "paste-file": {
      title: "Pasting",
      message: "“Paste” puts the clipboard copy into this folder. The original stays in “Documents”.",
      hints: ["Click the highlighted “Paste” button at the top.", "The button is only active when something is on the clipboard."],
    },
    "begin-rename": {
      title: "Renaming",
      message: "A good name is half of being organized. The pasted file is selected; click “Rename”.",
      hints: ["Click the highlighted “Rename” button."],
    },
    "rename-file": {
      title: "A new name",
      message: "Adding the year makes versions easy to tell apart. Type “Hisobot-2026.txt” and press Enter. Keep the .txt extension.",
      hints: ["Clear the old name and type Hisobot-2026.txt.", "Press Enter to confirm."],
      wrong: {
        name: "Type exactly “Hisobot-2026.txt”. Select the file, click “Rename” and try again.",
        check: "No file named “Hisobot-2026.txt” was found in “Loyiha”.",
      },
    },
    "delete-file": {
      title: "Deleting",
      message: "A deleted file does not vanish at once — it goes to the Recycle Bin. That is why mistakes can be undone.",
      hints: ["Make sure the file is selected.", "Click the highlighted “Delete” button at the top."],
    },
    "open-trash": {
      title: "Opening the Recycle Bin",
      message: "Deleted items wait in the Recycle Bin. Open it from the list on the left.",
      hints: ["Click the highlighted “Recycle Bin” row on the left."],
    },
    "select-trashed": {
      title: "Finding the file",
      message: "Here is the file you deleted. Select it first to restore it.",
      hints: ["Click “Hisobot-2026.txt” once."],
    },
    "restore-file": {
      title: "Restoring",
      message: "“Restore” returns the file to where it came from — the “Loyiha” folder.",
      hints: ["Click the highlighted “Restore” button."],
    },
    "search-file": {
      title: "Searching for a file",
      message: "If you forget where a file is, search helps. Type “hisobot” in the search box and matching files from every folder appear.",
      hints: ["Click the search box at the top right.", "Type the word hisobot."],
    },
    finish: {
      title: "Chapter 2 complete",
      message: "You created a folder, copied, renamed, deleted, restored and searched. A real computer uses the same operations: Ctrl+C, Ctrl+V, F2, Delete.",
    },
  },
};
