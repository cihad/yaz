### yaz

is a **execCommand** implementation for modern html elements like strong and to fixes awkward things on editable body.

It's simply and mini.

### Installation

to install node package:

```
npm install yaz
```

or use direct on web browser:
```html
<script src="http://unpkg.com/yaz"></script>
```

### Usage
For example:
```html
<button id="btn-bold">Make bold</button>
<p contenteditable>lorem ipsum dolor sit amet.</p>
```

```js
import yaz from 'yaz'

const toggleBold = () => {
	if (yaz.Range.isWrappedWith("STRONG")) {
		yaz.Range.undo("STRONG")
	} else {
		const element = document.createElement('strong')
		yaz.Range.surround(element)
	}
}

window['btn-bold'].onclick = toggleBold
```

That's it. For better UX lets impore the code:

```css
.active {
	font-weight: bold;
}
```

```diff
import yaz from 'yaz'

+ const theButton = window['btn-bold']

const toggleBold = () => {
	if (yaz.Range.isWrappedWith("STRONG")) {
		yaz.Range.undo("STRONG")
+		theButton.classList.remove('active')
	} else {
		const element = document.createElement('strong')
		yaz.Range.surround(element)
+		theButton.classList.add('active')
	}
}

+ theButton.onclick = toggleBold
```

Now the button looks visible active if the selected range is bold.