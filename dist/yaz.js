(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.yaz = factory());
}(this, function () { 'use strict';

	const SELF_CLOSING_TAGS = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

	// node'nin text node olup olmadigini denetler
	const isTextNode = node => node.nodeType == Node.TEXT_NODE;

	// node'nin element node olup olmadigini denetler
	const isElementNode = node => node.nodeType == Node.ELEMENT_NODE;

	// node'un baska kardesi olup olmadigini denetler
	const isOnlyChild = node => node.parentElement.childNodes.length === 1;

	const isSelfClosing = node => {
		if (node.nodeType === Node.TEXT_NODE) return false
		return SELF_CLOSING_TAGS.includes(node.tagName.toLowerCase())
	};

	const isEmpty = node => {
		if (!node.hasChildNodes()) return true

		return Array.from(node.childNodes).every(node => {
			if (isTextNode(node)) {
				return node.textContent.trim() === ''
			} else {
				return isEmpty(node)
			}
		})
	};

	const wrapOutWith = (dom, wrapperDOM) => {
		dom.parentNode.insertBefore(wrapperDOM, dom);
		wrapperDOM.appendChild(dom);
		return wrapperDOM
	};

	const wrapInWith = (dom, wrapperDOM) => {
		if (dom.nodeType === Node.TEXT_NODE) return
		if (isSelfClosing(dom)) return
		copyPasteChildNodes(wrapperDOM, dom);
		dom.appendChild(wrapperDOM);
		return dom
	};

	const unwrap = node => {
		while (node.hasChildNodes()) {
			node.parentNode.insertBefore(node.firstChild, node);
		}
		node.remove();
	};

	const copyPasteChildNodes = (pasteDOM, copyDOM) => {
		while (copyDOM.childNodes.length > 0) {
			pasteDOM.appendChild(copyDOM.childNodes[0]);
		}
		return pasteDOM
	};

	const composedPath = function(node) { 
		return getParentElements(node)
	};

	const getParents = (node, parentType = "parentNode") => {
		let path = [],
			currentNode = node;
		
		while (currentNode) {
			if (parentType === "parentElement" && currentNode.nodeType === Node.TEXT_NODE) {
				currentNode = currentNode[parentType];
				continue
			} else {
				path = [...path, currentNode];
				currentNode = currentNode[parentType];  
			}
		}
		
		return path;
	};

	const getParentsUntil = (node, parentNode, parentType = "parentNode") => {
		if (!node || !parentNode) return []
		
		let path = [],
			currentNode = node;
		
		while (currentNode && currentNode !== parentNode) {
			if (parentType === "parentElement" && currentNode.nodeType === Node.TEXT_NODE) {
				currentNode = currentNode[parentType];
				continue
			} else {
				path = [...path, currentNode];
				currentNode = currentNode[parentType];  
			}
		}
		
		return path;
	};

	const getParentNodes = node => getParents(node, "parentNode");
	const getParentElements = node => getParents(node, "parentElement");
	const getParentNodesUntil = (node, parentNode) => getParentsUntil(node, parentNode, "parentNode");
	const getParentElementsUntil = (node, parentNode) => getParentsUntil(node, parentNode, "parentElement");

	var Node$1 = /*#__PURE__*/Object.freeze({
		isTextNode: isTextNode,
		isElementNode: isElementNode,
		isOnlyChild: isOnlyChild,
		isEmpty: isEmpty,
		getParents: getParents,
		getParentsUntil: getParentsUntil,
		getParentNodes: getParentNodes,
		getParentElements: getParentElements,
		getParentNodesUntil: getParentNodesUntil,
		getParentElementsUntil: getParentElementsUntil,
		composedPath: composedPath,
		copyPasteChildNodes: copyPasteChildNodes,
		wrapInWith: wrapInWith,
		wrapOutWith: wrapOutWith,
		unwrap: unwrap,
		isSelfClosing: isSelfClosing
	});

	// →selection←
	// ↕: collapsed

	const ZERO_WITH_TEXT_NODE = () => document.createTextNode("\u200B");

	// range'in tag a sahip olmadigini denetler.
	// Ornek:
	// <strong>deneme →ali← veli</strong> 					=> isWrappedWith('STRONG') // true
	// <strong>deneme al↕i veli</strong> 					=> isWrappedWith('STRONG') // true
	// <strong>deneme →ali veli</strong><em>kirk←dokuz</em> => isWrappedWith('STRONG') // false
	// <strong>deneme →ali veli</strong><em>kirk←dokuz</em> => isWrappedWith('EM') // false
	// <strong>deneme <em>al↕i</em> veli</strong> 			=> isWrappedWith('EM') // true
	// <strong>deneme <em>a→li←</em> veli</strong> 			=> isWrappedWith('STRONG') // true
	const isWrappedWith = function(tagName, parentDOM) {
		const range = getRange();
		if (!range) return
		
		const node = range.commonAncestorContainer;

		const selectedTag = isSelectedWholeContentAnElement();
		if (selectedTag && selectedTag.tagName === tagName) {
			return selectedTag
		} else if (selectedTag) {
			return (getParentElements(range.commonAncestorContainer) || []).some(el => el.tagName === tagName)
		}
		
		if (parentDOM) {
			if (!parentDOM.contains(node)) return false
			return getParentsUntil(range.commonAncestorContainer, parentDOM).some(element => element.tagName === tagName)
		} else {
			return getParents(range.commonAncestorContainer).some(element => element.tagName === tagName)
		}
	};

	// rangein ust elemanlarindan herhangi birinde className e sahip eleman olup olmadigini denetler
	// <span class="note">ali ve↕li kirkdokuz</span><strong>elli</strong> 			=> isWrappedWithClassName('note') // true
	// <span class="note">ali ve→li← kirkdokuz</span><strong>elli</strong> 			=> isWrappedWithClassName('note') // true
	// <span class="note">ali <em>ve→li←</em> kirkdokuz</span><strong>elli</strong> => isWrappedWithClassName('note') // true
	// <span class="note">ali ve→li kirkdokuz</span><strong>el←li</strong> 			=> isWrappedWithClassName('note') // false
	// <span class="note">ali <em>ve→li</em> kirkdokuz</span><strong>el←li</strong> => isWrappedWithClassName('note') // false
	const isWrappedWithClassName = function(className, parentDOM) {
		const range = getRange();
		if (!range) return

		let dom = isSelectedWholeContentAnElement();
		if (dom && dom.classList.contains(className)) return true

		const node = range.commonAncestorContainer;
		if (parentDOM) {
			return getParentElementsUntil(node, parentDOM).some(node => node.classList.contains(className))
		} else {
			return getParentElements(node).some(node => node.classList.contains(className))
		}
	};

	// IYILESTIR EGER ELEMENT ALTINDAKI TEXT NODE HEPSI SECILSE BILE UNDEFINED DONUYOR.
	// secimin hepsinin bir elemana eslesip eslesmedigini denetler
	// 
	const isSelectedAnElement = (range) => {
		const textNode = isAllSelectedATextNode(range);
		if ( textNode && isOnlyChild(textNode))
			return textNode.parentElement

		const contentDocument = range.cloneContents();
		const elementNodes = Array.from(contentDocument.childNodes).filter(node => !(node.nodeType === Node.TEXT_NODE && node.textContent === ""));
		if (elementNodes.some(node => node.nodeType === Node.TEXT_NODE)) return
		return elementNodes.length === 1 && range.startContainer.childNodes[range.startOffset]
	};

	// secimin icinde element yoksa true dondurur degilse false
	// <span class="note">→ali veli kirkdokuz ←<strong>elli</strong></span>	=> isAllSelectedATextNode(range) // true
	// <span class="note">→ali veli← kirkdokuz <strong>elli</strong></span>	=> isAllSelectedATextNode(range) // false
	// <span class="note">→ali veli kirkdokuz <strong>elli←</strong></span>	=> isAllSelectedATextNode(range) // false
	// <span class="note">ali veli kirkdokuz <strong>→elli←</strong></span>	=> isAllSelectedATextNode(range) // true
	const isAllSelectedATextNode = range => {
		const { startContainer, startOffset } = range;
		const { childNodes } = range.cloneContents();

		if (Array.from(childNodes).some(isElementNode)) return false

		const textNode = isTextNode(startContainer) ? startContainer : startContainer.childNodes[startOffset];

		return textNode
			&& isTextNode(textNode)
			&& textNode.textContent.trim() === (childNodes.length && childNodes[0].textContent.trim())
			&& textNode
	};

	// <span class="note">→ali veli kirkdokuz ←<strong>elli</strong></span>
	// => isSelectedWholeContentAnElement() // false
	// 
	// <span class="note">→ali veli kirkdokuz <strong>elli</strong>←</span>
	// => isSelectedWholeContentAnElement() // true
	// 
	// <span class="note">→ali veli kirkdokuz <strong>el←li</strong></span>
	// => isSelectedWholeContentAnElement() // false
	const isSelectedWholeContentAnElement = () => {
		const range = getRange();
		if (!range) return
		
		const { startContainer, startOffset, endContainer, endOffset } = range;

		if (
			Array.from(startContainer.parentElement.childNodes).indexOf(startContainer) === 0
			&& startOffset === 0
			&& Array.from(endContainer.parentElement.childNodes).indexOf(endContainer) === endContainer.parentElement.childNodes.length - 1
			&& endContainer.nodeType === Node.TEXT_NODE
			&& endContainer.textContent.length === endOffset
			&& endContainer.parentElement === startContainer.parentElement
		) {
			return startContainer.parentElement
		}

		return isSelectedAnElement(range)
	};


	// O anki range'i verir. Range yoksa undefined verir.
	const getRange = () => {
		const selection = document.getSelection();
		if (selection.rangeCount === 0) return
		return selection.getRangeAt(0)
	};

	// Secimi verilen dom ile kaplar.
	// const strong = document.createElement('STRONG')
	// Lorem →ipsum dolor← sit amet
	// => surround(strong) // Lorem <strong>→ipsum dolor←</strong> sit amet
	// 
	// <em>Lorem →ipsum <u>dolor← sit</u> amet</em>
	// => surround(strong)
	// => <em>Lorem <strong>→ipsum <u>dolor</u>←</strong> <u>sit</u> amet</em>
	// 
	// Lorem ipsum dolor↕ sit amet
	// => surround(strong) // Lorem ipsum dolor<strong>&#8203;↕</strong> sit amet
	const surround = function(elementDOM) {
		let range = getRange();
		if (!range) return
		
		if (range.collapsed) {
			const textNode = ZERO_WITH_TEXT_NODE();
			range.insertNode(textNode);
			range.selectNode(textNode);
		}

		wrapSelectionWith(elementDOM);

		range.selectNodeContents(elementDOM);

		focusEditableElement();
	};

	// secimi verilen dom ile kaplar.
	// const strong = document.createElement('STRONG')
	// Lorem →ipsum dolor← sit amet
	// => wrapSelectionWith(strong) // Lorem <strong>ipsum dolor</strong> sit amet
	// 
	// <em>Lorem →ipsum <u>dolor← sit</u> amet</em>
	// => wrapSelectionWith(strong)
	// => <em>Lorem <strong>ipsum <u>dolor</u></strong> <u>sit</u> amet</em>
	// 
	// Lorem ipsum dolor↕ sit amet
	// => wrapSelectionWith(strong) // Lorem ipsum dolor<strong>&#8203;</strong> sit amet
	const wrapSelectionWith = function(elementDOM) {
		const range = getRange();
		if (!range) return
		const content = range.extractContents();
		copyPasteChildNodes(elementDOM, content);
		range.insertNode(elementDOM);

		// let lowestWrapper = elementDOM;

		// const hasOneElement = node => {
		// 	if (node.childNodes.length === 1) return true

		// 	return node
		// 		.childNodes
		// 		.filter(CustomNode.isElementNode)
		// 		.length === 1
		// }

		// while (hasOneElement(lowestWrapper)) {
		// 	lowestWrapper = lowestWrapper
		// }
	};


	// <strong>→<em><u>lorem ipsum dolor sit amet</u></em>←</strong>
	// wholeNestedElements(range) => [strong, em, u, text]
	const wholeNestedElements = range => {
		let selectedElement = isSelectedAnElement(range);
		if (!selectedElement) return

		let elements = [selectedElement];
		let currentElement = selectedElement;

		// To Up
		while (currentElement.parentElement.childNodes.length === 1) {
			elements = [currentElement.parentElement, ...elements];
			currentElement = currentElement.parentElement;
		}

		currentElement = selectedElement;

		// To Down
		while (currentElement.childNodes.length === 1) {
			currentElement = currentElement.childNodes[0];
			elements = [...elements, currentElement];
		}

		return elements
	};

	// collapsed range'in secili oldugu texti iki textNode'a boler
	// <strong>Lorem ip↕sum dolor</strong> => splitText()
	//         ↳______↲ ↳_______↲
	//         textNode  textNode
	const splitText = () => {
		const range = getRange();
		if (!range) return

		range.startContainer.splitText(range.startOffset);
		return [range.startContainer, range.startContainer.nextSibling]
	};


	// Ornek asagidaki gibi bir agac olsun. dolor'dan sonra ikiye bolelim.
	// <span>Lorem <strong>ipsum <em>dolor↕ sit</em> amet</strong> consetetur.</span>
	//                               ↳___↲
	//                                node
	// => const [mevcutDOM, yeniElement, bosElement] = nextSlice(node, "SPAN")
	// dedikten sonra mevcut dom:
	// <span>Lorem <strong>ipsum <em>dolor</em></strong></span>
	// return edilen degerler:
	// mevcutDOM: <span>Lorem <strong>ipsum <em>dolor</em></strong></span>
	// yeniElement: <span><strong><em> sit</em> amet</strong> consetetur.</span>
	// bosElement: <strong><em>&#8203;</em></strong>
	// Baska ornek:
	// <span>Lorem <strong>ipsum <em>dolor↕ sit</em> amet</strong> consetetur.</span>
	//                               ↳___↲
	//                                node
	// => const [mevcutDOM, yeniElement, bosElement] = nextSlice(node, "STRONG")
	// mevcutDOM => <span>Lorem <strong>ipsum <em>dolor</em></strong> consetetur.</span>
	// yeniElement => <strong><em>sit</em> amet</strong>
	// bosElement => <em>&#8203;</em>
	const nextSlice = (
		node,
		until,
		newEl = document.createTextNode(''),
		childEl = document.createTextNode("\u200B")
	) => {
		const { parentElement } = node;
		const el = parentElement.cloneNode();
		const emptyEl = el.cloneNode();
		emptyEl.append(childEl);
		el.append(newEl);
		while (node.nextSibling) {
			el.append(node.nextSibling);
		}

		if (parentElement && matchElements(el, until)) {
			let prevNode = parentElement,
				nextNode = el;

			if (isEmpty(parentElement)) {
				prevNode = parentElement.previousSibling;
				parentElement.remove();
			}

			if (isEmpty(el)) {
				nextNode = new DocumentFragment();
				el.remove();
			}

			return [prevNode, childEl, nextNode]
		} else {
			return nextSlice(parentElement, until, el, emptyEl)
		}
	};

	// <span class="note">Lorem ipsum <strong>→dolor sit←</strong> amet.</span>
	// => undo("STRONG")
	// => <span class="note">Lorem ipsum →dolor sit← amet.</span>
	const undo = until => {
		const range = getRange();
		if (!range) return

		if (range.collapsed) {
			splitBetweenWith(until);
			focusEditableElement();
			return
		}

		const element = isSelectedAnElement(range);

		if (element) {
			range.selectNode(element);
		}

		let extractedDoc = 	range.extractContents();

		if (
			extractedDoc.childNodes.length === 1 
			&& extractedDoc.firstElementChild
			&& matchElements(extractedDoc.firstElementChild, until)
		) {
			extractedDoc = Array.from(extractedDoc.childNodes[0].childNodes).reduce((acc, node) => {
				acc.append(node);
				return acc
			}, new DocumentFragment());

			range.insertNode(extractedDoc);
		} else {
			let startNode;

			if (isTextNode(range.startContainer)) {
				startNode = splitText()[0];
			} else {
				startNode = range.startContainer.childNodes[range.startOffset-1];
			}
			const [mountedDOM,,nextDOM] = nextSlice(startNode, until);
		
			mountedDOM.after(nextDOM);
			mountedDOM.after(extractedDoc);
		
			range.setStartAfter(mountedDOM);
			range.setEndBefore(nextDOM);
		}

		focusEditableElement();
	};

	// DOM ile 2. parametredeki kuralin eslesip eslesmedigini kontrol eder.
	// const el = document.createElement('SPAN')
	// matchElements(el, "span") => true
	// el.classList.add('note')
	// matchElements(el, { tagName: 'SPAN', className: 'note' }) => true
	const matchElements = (el, obj) => {
		if (typeof obj === 'string') obj = { tagName: obj };

		return el.tagName === obj.tagName
			&& (el.classList.length === 0 || el.classList.contains(obj.className))
	};

	const splitBetweenWith = tagName => {
		const [node, ] = splitText();
		const [dom, emptyDOM, newDOM] = nextSlice(node, tagName);
		dom.after(newDOM);
		dom.after(emptyDOM);
		const range = getRange();
		if (!range) return
		let textNode = emptyDOM;
		while (textNode.firstChild) {
			textNode = textNode.firstChild;
		}
		range.selectNode(textNode);
	};

	const focusEditableElement = () => {
		const range = getRange();
		if (!range) return
		let editableEl = range.commonAncestorContainer;

		while (editableEl.parentElement.isContentEditable) {
			editableEl = editableEl.parentElement;
		}

		editableEl.focus();
	};

	const unwrapWith = tagName => {
		const range = getRange();
		if (!range) return

		let element = range.commonAncestorContainer;

		while (element.tagName !== tagName) {
			if (!element.isContentEditable && !isTextNode(element)) {
				element = null;
				break
			}

			element = element.parentElement;
		}

		if (!element) return
		unwrap(element);
	};

	var Range = /*#__PURE__*/Object.freeze({
		getRange: getRange,
		isWrappedWith: isWrappedWith,
		isWrappedWithClassName: isWrappedWithClassName,
		isAllSelectedATextNode: isAllSelectedATextNode,
		isSelectedAnElement: isSelectedAnElement,
		isSelectedWholeContentAnElement: isSelectedWholeContentAnElement,
		surround: surround,
		wrapSelectionWith: wrapSelectionWith,
		wholeNestedElements: wholeNestedElements,
		nextSlice: nextSlice,
		splitBetweenWith: splitBetweenWith,
		splitText: splitText,
		undo: undo,
		unwrapWith: unwrapWith
	});

	var index = {
		Range,
		Node: Node$1
	};

	return index;

}));
//# sourceMappingURL=yaz.js.map
