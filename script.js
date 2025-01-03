import Pickr from "https://esm.run/@simonwep/pickr@1.9.1";
import html2canvas from "https://esm.run/html2canvas@1.4.1";
import Sortable from "https://esm.run/sortablejs@1.15.2";

const defaultColors = [
	"#ff7f7e",
	"#ffbf7f",
	"#feff7f",
	"#7eff80",
	"#7fffff",
	"#807fff",
	"#ff7ffe",
];
const clearColor = "#778899";

const mainContainer = document.querySelector("main");
const imagesBar = document.querySelector("#images-bar");
const exportContainer = document.querySelector("#export-container");
const exportedImage = document.querySelector("#exported-image");
const blackout = document.querySelector("#blackout");

addContainerDrag(imagesBar);

document.querySelector("#new-tier").onclick = () => addRow();
document.querySelector("#export-image").onclick = () => exportImage();
document.querySelector("#save-image").onclick = () => saveImage();
blackout.onclick = () => hideBlackout();

document.querySelector("#select-images").onchange = (e) => {
	uploadImages(e.target.files);
};

document.querySelectorAll(".row").forEach((row, index) => {
	addRowListeners(row, defaultColors[index]);
});

// Automatically apply the square-img class on page load
document.body.classList.add("square-img");

document.addEventListener("drop", (e) => {
	e.preventDefault();
	uploadImages(e.dataTransfer.files);
});

document.addEventListener("dragover", (e) => {
	e.preventDefault();
});

document.addEventListener("mousedown", (e) => {
	const ignoreSelectors = [".pcr-app", ".export-container"];
	const ignoreClick = ignoreSelectors.some((selector) =>
		e.target.closest(selector),
	);

	if (ignoreClick) {
		return;
	}

	const menuClicked = e.target.closest(".tier-label");
	const visibleMenus = document.querySelectorAll('[data-visibility="visible"]');

	if (menuClicked) {
		const tooltip = menuClicked.querySelector(".tooltip");

		for (const menu of visibleMenus) {
			if (menu !== tooltip) {
				menu.dataset.visibility = "hidden";
			}
		}

		tooltip.dataset.visibility = "visible";
		return;
	}

	for (const menu of visibleMenus) {
		menu.dataset.visibility = "hidden";
	}
});

function createColorPicker(colorPicker, tierLabel, defaultColor) {
	const pickr = new Pickr({
		el: colorPicker,
		theme: "monolith",
		default: defaultColor,
		swatches: defaultColors,
		components: {
			preview: true,
			hue: true,
			interaction: {
				input: true,
				clear: true,
				save: true,
			},
		},
	});

	pickr.on("save", (color) => {
		if (color === null) {
			pickr.setColor(clearColor);
			return;
		}

		const hsl = color.toHSLA();
		const lightness = hsl[2];

		tierLabel.style.backgroundColor = color.toHEXA().toString();
		tierLabel.style.color = lightness < 50 ? "white" : "black";

		pickr.hide();
	});

	return pickr;
}

function addRow(tierName = "New tier", defaultColor = null) {
	// If no default color is provided, pick a random color from the defaultColors list
	if (!defaultColor) {
		defaultColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];
	}

	const newRow = document.createElement("div");
	newRow.className = "row";
	newRow.innerHTML = `
		<div class="tier-label" style="background-color: ${defaultColor}">
			<div class="label-text" contenteditable="true">
				<span>${tierName}</span>
			</div>
			<div class="tooltip" data-visibility="hidden">
				<div class="color-picker"></div>
			</div>
		</div>
		<div class="tier sort"></div>
		<div class="tier-options" data-html2canvas-ignore>
			<div class="options-container">
				<div class="option delete">
					<span>🗑️</span>
				</div>
				<div class="option up">
					<span>⬆️</span>
				</div>
				<div class="option down">
					<span>⬇️</span>
				</div>
			</div>
		</div>
	`;

	mainContainer.appendChild(newRow);
	addRowListeners(newRow, defaultColor); // Pass selected defaultColor
}

function addRowListeners(row, defaultColor) {
	const colorPicker = row.querySelector(".color-picker");
	const tierLabel = row.querySelector(".tier-label");

	const tierSort = row.querySelector(".sort");

	const deleteButton = row.querySelector(".option.delete"); // Updated to work with emoji directly
	const upButton = row.querySelector(".option.up span");
	const downButton = row.querySelector(".option.down span");

	const pickr = createColorPicker(colorPicker, tierLabel, defaultColor);
	const dragInstance = addContainerDrag(tierSort);

	// Set emoji content for delete button
	deleteButton.innerHTML = "🗑️";

	deleteButton.onclick = () => {
		pickr.destroyAndRemove();
		dragInstance.destroy();
		row.remove();
	};
	upButton.onclick = () => {
		moveRow(row, -1);
	};
	downButton.onclick = () => {
		moveRow(row, 1);
	};
}

function moveRow(row, direction) {
	const rows = Array.from(mainContainer.children);
	const currentIndex = rows.indexOf(row);
	const newIndex = currentIndex + direction;

	if (newIndex < 0 || newIndex >= rows.length) {
		return;
	}

	const rowBefore = direction === -1 ? rows[newIndex] : rows[newIndex + 1];

	mainContainer.insertBefore(row, rowBefore);
}

function uploadImages(files) {
	if (!files) {
		return;
	}

	for (const file of files) {
		if (file.type.split("/")[0] !== "image") {
			continue;
		}

		const image = new Image();
		image.src = URL.createObjectURL(file);

		const imageEl = document.createElement("div");
		imageEl.classList.add("tier-element");
		imagesBar.appendChild(imageEl);

		image.onload = () => {
			imageEl.style.aspectRatio = `${image.width} / ${image.height}`;
			imageEl.style.backgroundImage = `url("${image.src}")`;
			imageEl.style.minHeight = `${Math.min(image.height, 80)}px`;
		};
	}
}

function addContainerDrag(container) {
	return new Sortable(container, { group: "tiers" });
}

async function exportImage() {
	const canvas = await html2canvas(mainContainer, {
		scale: 1.5,
		windowWidth: 1080,
	});
	exportedImage.src = canvas.toDataURL();

	exportContainer.dataset.visibility = "visible";
	blackout.dataset.visibility = "visible";
}

function saveImage() {
	const downloadLink = document.createElement("a");
	downloadLink.href = exportedImage.src;
	downloadLink.download = "image.png";

	downloadLink.click();
}

function hideBlackout() {
	blackout.dataset.visibility = "hidden";
	exportContainer.dataset.visibility = "hidden";
}