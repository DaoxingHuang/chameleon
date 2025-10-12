// /**
//  * Checks if the provided element is of the specified HTML element type.
//  * This method is generalized to work with any HTMLElement type (e.g., div, canvas, p, etc.).
//  * 
//  * @param element - The element to check. Should be a valid HTMLElement.
//  * @param type - The HTML element type to check against, e.g., HTMLDivElement, HTMLCanvasElement, HTMLParagraphElement, etc.
//  * @returns `true` if the element is of the specified type, otherwise `false`.
//  */
// function isElementOfType<T extends HTMLElement>(element: HTMLElement, type: { new (): T }): boolean {
//   // Check for null or undefined elements
//   if (!element) return false;

//   // Check if the element is an instance of the specified type (e.g., HTMLDivElement, HTMLCanvasElement, HTMLParagraphElement)
//   return element instanceof type;
// }

// // Usage examples

// // Directly using document.querySelector for validation
// const divElement = document.querySelector('div');
// const canvasElement = document.querySelector('canvas');
// const pElement = document.querySelector('p');

// // Check if the element is a <div> element
// console.log(isElementOfType(divElement, HTMLDivElement));  // true if it's a <div>

// // Check if the element is a <canvas> element
// console.log(isElementOfType(canvasElement, HTMLCanvasElement));  // true if it's a <canvas>

// // Check if the element is a <p> element
// console.log(isElementOfType(pElement, HTMLParagraphElement));  // true if it's a <p>