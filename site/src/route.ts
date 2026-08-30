if (location.pathname === "/" && new URLSearchParams(location.search).get("demo") === "1") {
  location.replace("/demo/?demo=1");
}

const heading = document.querySelector<HTMLElement>("h1");
const status = document.querySelector<HTMLElement>(".route-status");
if (heading) {
  requestAnimationFrame(() => {
    heading.focus({ preventScroll: true });
    if (status) status.textContent = heading.textContent ?? "";
  });
}
