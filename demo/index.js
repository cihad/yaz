const BOLD = () => document.createElement('strong')
const ITALIC = () => document.createElement('em')
const U = () => document.createElement('u')
const NOTE = () => {
	const node = document.createElement('span')
	node.classList.add('note')
	return node
}
const LINK = (url) => {
	const link = document.createElement('a')
	link.href = url
	return link
}

const IS_BOLD = () => yaz.Range.isWrappedWith("STRONG")
const IS_ITALIC = () => yaz.Range.isWrappedWith("EM")
const IS_U = () => yaz.Range.isWrappedWith("U")
const IS_NOTE = () => {
  	return yaz.Range.isWrappedWithClassName("note")
}
const IS_LINK = () => yaz.Range.isWrappedWith("A")

const DO_BOLD = () => yaz.Range.surround(BOLD())
const DO_ITALIC = () => yaz.Range.surround(ITALIC())
const DO_U = () => yaz.Range.surround(U())
const DO_NOTE = () => yaz.Range.surround(NOTE())
const DO_LINK = url => yaz.Range.surround(LINK(url))

const UNBOLD = () => yaz.Range.undo("STRONG")
const UNITALIC = () => yaz.Range.undo("EM")
const UNU = () => yaz.Range.undo("U")
const UNNOTE = () => yaz.Range.undo({ className: "note", tagName: "SPAN" })
const UNLINK = () => yaz.Range.undo("A")

function escapeHtml(str) {
  	return str.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "\"").replace(/'/g, "'");
}

document.addEventListener('selectionchange', () => {
	window['output'].innerText = window['editable'].outerHTML

	document.querySelectorAll('.btn').forEach(button => {
		let isActive = false;
		switch (button.dataset.wrapTag) {
			case "EM":
				isActive = !!IS_ITALIC()
				break;
			case "STRONG":
				isActive = !!IS_BOLD()
				break;
			case "U":
				isActive = !!IS_U()
					break;
				case "LINK":
				isActive = !!IS_LINK()
				break;
			case "NOTE":
				isActive = !!IS_NOTE()
				break;
		}

		isActive ? button.classList.add('active') : button.classList.remove('active')
	})
})

document.querySelectorAll('.btn').forEach(button => {
	button.addEventListener('click', (event) => {
		event.preventDefault()

		switch (event.target.dataset['wrapTag']) {
			case "STRONG":
				IS_BOLD() ? UNBOLD() : DO_BOLD()
				break;
			case "EM":
				IS_ITALIC() ? UNITALIC() : DO_ITALIC()
				break;
			case "U":
				IS_U() ? UNU() : DO_U()
				break;
			case "LINK":
				if (IS_LINK()) {
					UNLINK()
				} else {
					const range = yaz.Range.getRange()
					if (range.collapsed) return

					const url = prompt("URL")
					if (url === null || url === "") return
					DO_LINK(url)
				}
				break;
			case "NOTE":
				IS_NOTE() ? UNNOTE() : DO_NOTE()
				break;
		}

		editable.focus()
	})
})
