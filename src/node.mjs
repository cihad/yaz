const SELF_CLOSING_TAGS = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']

// node'nin text node olup olmadigini denetler
const isTextNode = node => node.nodeType == Node.TEXT_NODE

// node'nin element node olup olmadigini denetler
const isElementNode = node => node.nodeType == Node.ELEMENT_NODE

// node'un baska kardesi olup olmadigini denetler
const isOnlyChild = node => node.parentElement.childNodes.length === 1

const isSelfClosing = node => {
	if (node.nodeType === Node.TEXT_NODE) return false
	return SELF_CLOSING_TAGS.includes(node.tagName.toLowerCase())
}

const isEmpty = node => {
	if (!node.hasChildNodes()) return true

	return Array.from(node.childNodes).every(node => {
		if (isTextNode(node)) {
			return node.textContent.trim() === ''
		} else {
			return isEmpty(node)
		}
	})
}

const wrapOutWith = (dom, wrapperDOM) => {
	dom.parentNode.insertBefore(wrapperDOM, dom)
	wrapperDOM.appendChild(dom)
	return wrapperDOM
}

const wrapInWith = (dom, wrapperDOM) => {
	if (dom.nodeType === Node.TEXT_NODE) return
	if (isSelfClosing(dom)) return
	copyPasteChildNodes(wrapperDOM, dom)
	dom.appendChild(wrapperDOM)
	return dom
}

const unwrap = node => {
	while (node.hasChildNodes()) {
		node.parentNode.insertBefore(node.firstChild, node)
	}
	node.remove()
}

const copyPasteChildNodes = (pasteDOM, copyDOM) => {
	while (copyDOM.childNodes.length > 0) {
		pasteDOM.appendChild(copyDOM.childNodes[0]);
	}
	return pasteDOM
}

const composedPath = function(node) { 
	return getParentElements(node)
}

const getParents = (node, parentType = "parentNode") => {
	let path = [],
		currentNode = node
	
	while (currentNode) {
		if (parentType === "parentElement" && currentNode.nodeType === Node.TEXT_NODE) {
			currentNode = currentNode[parentType];
			continue
		} else {
			path = [...path, currentNode]
			currentNode = currentNode[parentType];  
		}
	}
	
	return path;
}

const getParentsUntil = (node, parentNode, parentType = "parentNode") => {
	if (!node || !parentNode) return []
	
	let path = [],
		currentNode = node
	
	while (currentNode && currentNode !== parentNode) {
		if (parentType === "parentElement" && currentNode.nodeType === Node.TEXT_NODE) {
			currentNode = currentNode[parentType];
			continue
		} else {
			path = [...path, currentNode]
			currentNode = currentNode[parentType];  
		}
	}
	
	return path;
}

const getParentNodes = node => getParents(node, "parentNode")
const getParentElements = node => getParents(node, "parentElement")
const getParentNodesUntil = (node, parentNode) => getParentsUntil(node, parentNode, "parentNode")
const getParentElementsUntil = (node, parentNode) => getParentsUntil(node, parentNode, "parentElement")

export {
	isTextNode,
	isElementNode,
	isOnlyChild,
	isEmpty,
	getParents,
	getParentsUntil,
	getParentNodes,
	getParentElements,
	getParentNodesUntil,
	getParentElementsUntil,
	composedPath,
	copyPasteChildNodes,
	wrapInWith,
	wrapOutWith,
	unwrap,
	isSelfClosing,
}