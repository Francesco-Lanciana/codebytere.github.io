/* global $, localStorage, Shell */

const errors = {
  invalidDirectory: 'Error: not a valid directory',
  noWriteAccess: 'Error: you do not have write access to this directory',
  fileNotFound: 'Error: file not found in current directory',
  fileNotSpecified: 'Error: you did not specify a file'
}

const struct = {
  root: ['about', 'resume', 'contact', 'talks', 'tinks'],
  projects: ['nodemessage', 'map', 'dotify', 'slack_automation'],
  skills: ['proficient', 'familiar', 'learning']
}

const commands = {}
let systemData = {}
const rootPath = 'users/codebytere/root';
const previousSuggestions = new Set();

const getDirectory = () => localStorage.directory
const setDirectory = (dir) => { localStorage.directory = dir }

// turn on fullscreen
const registerFullscreenToggle = () => {
  $('.button.green').click(() => {
    $('.terminal-window').toggleClass('fullscreen')
  })
}

// create new directory in current directory
commands.mkdir = () => errors.noWriteAccess

// create new directory in current directory
commands.touch = () => errors.noWriteAccess

// remove file from current directory
commands.rm = () => errors.noWriteAccess

// view contents of current directory
commands.ls = () => systemData[getDirectory()]

// view list of possible commands
commands.help = () => systemData.help

// display current path
commands.path = () => {
  const dir = getDirectory()
  return dir === 'root' ? rootPath : `${rootPath}/${dir}`
}

// see command history
commands.history = () => {
  let history = localStorage.history
  history = history ? Object.values(JSON.parse(history)) : []
  return `<p>${history.join('<br>')}</p>`
}

// move into specified directory
commands.cd = (newDirectory) => {
  const currDir = getDirectory()
  const dirs = ['root', 'projects', 'skills']
  const newDir = newDirectory ? newDirectory.trim() : ''

  if (dirs.includes(newDir) && currDir !== newDir) {
    setDirectory(newDir)
  } else if (newDir === '') {
    setDirectory('root')
  } else {
    return errors.invalidDirectory
  }
  return null
}

// display contents of specified file
commands.cat = (filename) => {
  if (!filename) return errors.fileNotSpecified

  const dir = getDirectory()
  const fileKey = filename.split('.')[0]

  if (fileKey in systemData && struct[dir].includes(fileKey)) {
    return systemData[fileKey]
  }

  return errors.fileNotFound
}

/* This doesn't actually write the input to the terminal concrectely as this
would make looping over possible suggestions impossible (you would most likely 
reach edge nodes in the graph of possible suggestions) */
commands.autocomplete = (currentInput) => {
  const dir = getDirectory();

  if (currentInput === "") {
    for (let i=0; i < struct[dir].length; i++) {
      const possibleSuggestion = struct[dir][i];
      if (previousSuggestions.has(possibleSuggestion)) continue;

      previousSuggestions.add(possibleSuggestion);
      return possibleSuggestion;
    }

    const firstFileMatch = struct[dir][0];

    previousSuggestions.clear();
    previousSuggestions.add(firstFileMatch);

    return firstFileMatch;
  }

  const currentInputKey = currentInput.split('.')[0];

  let longestLengthMatch = 0;
  let matchingFile = "";
  let numPossibleSuggestions = 0;

  /* We aim to predict future user keystrokes by guessing what files 
  the user may be wanting to reference based off their current keystrokes. 
  we now want the file whose file name is greater than the current input in length, 
  with the condition that either it hasnt been suggested before, or that all 
  possible matches have already been suggested. */
  struct[dir].forEach(function (file) {
    if (currentInputKey.length > file.length || currentInputKey === file) return;
    if (file.indexOf(currentInputKey) === 0) numPossibleSuggestions++;
    if ((longestLengthMatch !== 0 && file.length > longestLengthMatch) || previousSuggestions.has(file)) return;

    if ((longestLengthMatch === 0 || file.length < longestLengthMatch) && file.indexOf(currentInputKey) === 0) {
      matchingFile = file;
      longestLengthMatch = file.length;
    }

    /* We will skip over files of the same name but different extension here since we
    ignore the extension (this can't be fixed without considering the extension) */
    if (file.length === longestLengthMatch && file.indexOf(currentInputKey) === 0) {
      for (var i = currentInputKey.length; i < file.length; i++) {
        if (file.charAt(i) > matchingFile.charAt(i)) break;
        if (file.charAt(i) === matchingFile.charAt(i)) continue;

        if (file.charAt(i) < matchingFile.charAt(i)) {
          matchingFile = file;
        }
      }
    }
  });

  if (matchingFile) previousSuggestions.add(matchingFile);

  // Clearing the previous suggestions once all suggestions have been made allows for looping 
  if (previousSuggestions.size === numPossibleSuggestions) previousSuggestions.clear();

  return matchingFile;
}

// initialize cli
$(() => {
  registerFullscreenToggle()
  const cmd = document.getElementById('terminal')
  const terminal = new Shell(cmd, commands)

  $.ajaxSetup({ cache: false })
  $.get('data/system_data.json', (data) => {
    systemData = data
  })
})
