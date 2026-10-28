export default {
  title: "A new desktop",
  summary: "Get to know the desktop, windows, the taskbar and the Start menu.",
  steps: {
    welcome: {
      title: "Welcome",
      message: "This is your new workspace. The computer on screen really responds: every click has an effect. If you make a mistake nothing breaks — you can simply try again.",
    },
    "select-icon": {
      title: "Selecting an icon",
      message: "The small pictures on the desktop are called icons. A single click selects an icon. Let’s click the “Documents” icon once.",
      hints: ["Find the highlighted “Documents” folder on the left.", "Move the mouse over that icon and press the left button once."],
      wrong: {
        wallpaper: "That is the desktop background. Clicking it selects nothing. Click the “Documents” icon.",
        otherIcon: "That is a different icon. Click the highlighted “Documents” icon.",
      },
    },
    "open-icon": {
      title: "Opening a folder",
      message: "To open an icon you double-click it: two quick clicks in a row. On a touch screen, tap twice quickly.",
      hints: ["Click the selected “Documents” icon again, twice in quick succession.", "Keep the pause between clicks under one second."],
      wrong: { single: "A single click only selects. To open, click twice quickly." },
    },
    maximize: {
      title: "Making a window bigger",
      message: "Each window has three buttons in its top-right corner. The middle one stretches the window across the whole screen — handy for working comfortably.",
      hints: ["Click the highlighted square button in the window’s top-right corner."],
    },
    "restore-size": {
      title: "Restoring the size",
      message: "The same button now returns the window to its earlier size. One button, two jobs — depending on the current state.",
      hints: ["Click that same button again."],
    },
    minimize: {
      title: "Minimizing a window",
      message: "The dash (—) button hides a window without closing it. It stays on the taskbar and your work is kept.",
      hints: ["Click the highlighted dash-shaped button."],
    },
    "taskbar-restore": {
      title: "The taskbar",
      message: "The bar along the bottom is the taskbar. It lists your open programs. To bring a hidden window back, click its button.",
      hints: ["Look at the bottom bar — there is a button labelled “Documents”.", "Click that button once."],
    },
    "close-window": {
      title: "Closing a window",
      message: "When you are done, close the window. The close button (×) is on the right. A closed window also disappears from the taskbar.",
      hints: ["Click the × button in the window’s top-right corner."],
    },
    "open-start": {
      title: "The Start menu",
      message: "The Start button is the doorway to all your programs. You will find it at the left end of the taskbar.",
      hints: ["Click the highlighted Start button at the bottom left."],
    },
    "open-notes": {
      title: "Launching a program",
      message: "We pick a program from the menu. “Notepad” is a simple program for typing text.",
      hints: ["Click the “Notepad” row in the menu."],
    },
    "type-text": {
      title: "Typing text",
      message: "Inside the window there is a writing area. Click it and type any word on the keyboard — the text appears immediately.",
      hints: ["Click the white area, then type at least three letters."],
      wrong: { check: "Type at least three characters." },
    },
    "close-notes": {
      title: "Closing Notepad",
      message: "Saving is not needed for this exercise. On a real computer the program would ask about unsaved text — we cover that in later chapters.",
      hints: ["Click the × button on the Notepad window."],
    },
    finish: {
      title: "Chapter 1 complete",
      message: "You selected and opened an icon, managed a window, and launched a program from the Start menu. Next we will work with files and folders.",
    },
  },
};
