import "@testing-library/jest-dom";

Object.defineProperty(Element.prototype, "scrollIntoView", {
  configurable: true,
  value: () => {},
});
