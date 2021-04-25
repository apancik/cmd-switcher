const { ipcRenderer, desktopCapturer } = require("electron");

// =====
// MODEL
// =====

let model = {
	target: 0,
	windows: [],
};

// ==================
// CONTROLLER METHODS
// ==================

const updateWindowsData = (callback) => {
	console.log("Update windows data");

	desktopCapturer
		.getSources({
			types: ["window"],
			thumbnailSize: {
				height: 400,
				width: 400,
			},
			fetchWindowIcons: true,
		})
		.then((sources) => {
			console.log(sources);

			model.windows = sources.map((source) => {
				return {
					name: source.name,
					id: source.id,
					thumbnail: source.thumbnail.toDataURL(),
					appIcon: source.appIcon.toDataURL(),
				};
			});
		})
		.then(callback);
};

// =================
// CONTROLLER EVENTS
// =================

TAB_KEYCODE = 15;
ALT_KEYCODE = 56; // 3675 for cmd

ipcRenderer.on("keydown", (event, payload) => {
	if (payload.altKey) {
		switch (payload.keycode) {
			case TAB_KEYCODE:
				model.target++;
				highlightWindow(model.target % model.windows.length);

				const oneRow = Math.min(model.windows.length, 4);
				const width = 200 * oneRow + 40; // +16 to account for margins
				const height = 200 * (Math.floor((model.windows.length - 1) / oneRow) + 1);

				console.log(Math.trunc(model.windows.length / oneRow), oneRow, width, height);

				ipcRenderer.send("show-window", width, height);
				break;
			case ALT_KEYCODE:
				// BUG race condition
				updateWindowsData(displayWindows); // possibly first fetch without icons and thumbnails to improve performance
				break;
		}
	}
});

ipcRenderer.on("keyup", (event, payload) => {
	if (payload.altKey && payload.keycode == ALT_KEYCODE) {
		if (model.target) {
			const targetWindow = model.windows[model.target % model.windows.length];
			ipcRenderer.send("focus", targetWindow.id.split(":")[1]);
			model.target = 0;
		}
		ipcRenderer.send("hide-window");
	}
});

// ====
// VIEW
// ====

const highlightWindow = (n) => {
	const allWindows = document.querySelectorAll(".window");

	allWindows.forEach((window) => {
		window.classList.remove("selected");
	});

	allWindows[n % model.windows.length].classList.add("selected");
};

const displayWindows = () => {
	const body = document.querySelector("body");

	body.innerHTML = "";

	model.windows.forEach((window) => {
		const windowElement = document.createElement("div");
		windowElement.classList.add("window");

		const icon = document.createElement("img");
		icon.src = window.appIcon;
		icon.classList.add("icon");

		const name = document.createElement("span");
		name.textContent = window.name;
		name.classList.add("name");

		const thumbnail = document.createElement("img");
		thumbnail.src = window.thumbnail;
		thumbnail.classList.add("thumbnail");

		windowElement.appendChild(icon);
		windowElement.appendChild(name);
		windowElement.appendChild(thumbnail);

		body.appendChild(windowElement);
	});
};
