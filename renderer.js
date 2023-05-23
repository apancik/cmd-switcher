const { ipcRenderer, desktopCapturer } = require('electron')

// =====
// MODEL
// =====

let model = {
  displayed: false,
  target: 1,
  windows: []
}

// ==========
// CONTROLLER
// ==========

TAB_KEYCODE = 15
ALT_KEYCODE = 56 // 3675 for cmd

ipcRenderer.on('keydown', (event, payload) => {
  if (payload.altKey && !model.displayed) {
    desktopCapturer
      .getSources({
        types: ['window'],
        thumbnailSize: {
          height: 200,
          width: 200
        },
        fetchWindowIcons: true
      })
      .then(sources => {
        model.windows = sources

        if (model.windows.length && payload.keycode === TAB_KEYCODE) {
          const oneRow = Math.min(model.windows.length, 6)
          const width = 200 * oneRow // +16 to account for margins
          const height =
            200 * (Math.floor((model.windows.length - 1) / oneRow) + 1)

          displayWindows()

          model.displayed = true
          ipcRenderer.send('show-window', width, height)
        }
      })
  } else if (model.displayed) {
    model.target = (model.target + 1) % model.windows.length

    displayWindows()
  }
})

ipcRenderer.on('keyup', (event, payload) => {
  if (payload.altKey && payload.keycode == ALT_KEYCODE) {
    if (model.displayed) {
      const targetWindow = model.windows[model.target]
      ipcRenderer.send('focus', targetWindow.id.split(':')[1])
      model.target = 1
    }
    ipcRenderer.send('hide-window')
    model.displayed = false
  }
})

// ====
// VIEW
// ====

const displayWindows = () => {
  let fragment = document.createDocumentFragment()

  model.windows
    .map(source => {
      return {
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
        appIcon: source.appIcon.toDataURL()
      }
    })
    .forEach((window, index) => {
      const windowElement = document.createElement('div')

      windowElement.innerHTML = `<div class="window ${
        index === model.target ? 'selected' : ''
      }">
			<img src="${window.appIcon}" class="icon" />
			<span class="name">${window.name}</span>
			<img src="${window.thumbnail}" class="thumbnail" />
			</div>`

      fragment.appendChild(windowElement)
    })

  const body = document.querySelector('body')
  body.innerHTML = ''
  body.appendChild(fragment)
}
