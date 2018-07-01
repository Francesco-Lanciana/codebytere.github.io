/* global $, localStorage */

class Shell {
  constructor (term, commands) {
    this.commands = commands
    this.setupListeners(term)
    this.term = term

    localStorage.directory = 'root'
    localStorage.history = JSON.stringify('')

    $('.input').focus()
  }

  setupListeners (term) {
    $('#terminal').mouseup(() => {
      $('.input').last().focus()
    })

    term.addEventListener('keyup', (evt) => {
      const keyUp = 38
      const keyDown = 40
      const key = evt.keyCode

      if ([keyUp, keyDown].includes(key)) {
        let history = localStorage.history
        history = history ? Object.values(JSON.parse(history)) : []

        if (key === keyUp && localStorage.historyIndex >= 0) {
          $('.input').last().html(`${history[localStorage.historyIndex]}<span class="end"><span>`)
          localStorage.historyIndex -= 1
        } else if (key === keyDown && localStorage.historyIndex < history.length) {
          $('.input').last().html(history[localStorage.historyIndex])
          localStorage.historyIndex += 1
        }
        evt.preventDefault()
        $('.end').focus()
      }
    })

    term.addEventListener('keydown', (evt) => {
      const prompt = evt.target;
      const suggestionEl = prompt.parentNode.parentNode.querySelector('.suggestion');

      // Delete or space is pressed
      if (evt.keyCode === 8 || evt.keyCode === 32) {
        suggestionEl.innerHTML = '';
      }

      if (evt.keyCode === 39 && suggestionEl.textContent !== "") {
        prompt.innerHTML = suggestionEl.innerHTML;
        suggestionEl.innerHTML = '';

        this.placeCaretAtEnd(prompt);
      }

      // a tab is pressed
      if (evt.keyCode === 9) {
        evt.preventDefault();

        const input = prompt.textContent.split(/\s/);
        const cmd = input[0];
        const args = input[1];

        if (cmd === "cat" && args !== undefined) {
          const suggestion = this.commands.autocomplete(args);
          
          evt.target.parentNode.parentNode.querySelector('.suggestion').innerHTML = `${cmd}${String.fromCharCode(160)}${suggestion}`;
        }

      // escape key is pressed
      } else if (evt.keyCode === 27) {
        $('.terminal-window').toggleClass('fullscreen')
      }
    })

    term.addEventListener('keypress', (evt) => {
      const prompt = evt.target;
      const input = prompt.textContent.trim().split(/\s/);
      const cmd = input[0];
      const args = input[1];
      const suggestionEl = evt.target.parentNode.parentNode.querySelector('.suggestion');
      const currentSuggestion = suggestionEl.textContent;
      const suggestionExists = currentSuggestion !== "";

      if (suggestionExists) {
        const letterIndex = args ? args.length : 0;
        const nextSuggestionLetter = currentSuggestion.trim().split(/\s/)[1].charAt(letterIndex);
      
        if (String.fromCharCode(evt.keyCode) !== nextSuggestionLetter) {
          suggestionEl.innerHTML = "";
        }
      }


      if (evt.keyCode === 13) {
        localStorage.historyIndex = 0;

        if (cmd === 'clear') {
          this.clearConsole()
        } else if (cmd && cmd in this.commands) {
          this.runCommand(cmd, args)
          this.resetPrompt(term, prompt)
          $('.root').last().html(localStorage.directory)
        } else {
          this.term.innerHTML += 'Error: command not recognized'
          this.resetPrompt(term, prompt)
        }
        evt.preventDefault()
      }
    })
  }

  placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
  }

  runCommand (cmd, args) {
    const command = args ? `${cmd} ${args}` : cmd
    this.updateHistory(command)

    const output = this.commands[cmd](args)
    if (output) { this.term.innerHTML += output }
  }

  resetPrompt (term, prompt) {
    const newPrompt = prompt.parentNode.parentNode.cloneNode(true)
    prompt.setAttribute('contenteditable', false)
    if (this.prompt) {
      newPrompt.querySelector('.prompt').textContent = this.prompt
    }
    term.appendChild(newPrompt)
    newPrompt.querySelector('.input').innerHTML = ''
    newPrompt.querySelector('.input').focus()
  }

  updateHistory (command) {
    let history = localStorage.history
    history = history ? Object.values(JSON.parse(history)) : []

    history.push(command)
    localStorage.history = JSON.stringify(history)
    localStorage.historyIndex = history.length - 1
  }

  clearConsole () {
    $('#terminal').html(
      `<p class="hidden">
        <span class="prompt">
          <span class="root">root</span>
          <span class="tick">❯</span>
        </span>
        <span contenteditable="true" class="input"></span>
      </p>`
    )
    $('.input').focus()
  }
}
