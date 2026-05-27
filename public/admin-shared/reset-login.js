// Shared "Reset login" recovery button for Decap CMS admin pages.
// Included from /admin/, /book-admin/, /gym-admin/, /goals-admin/.
//
// Decap caches the GitHub OAuth token in localStorage, and github.com
// keeps its own session cookie — so once you log in with the wrong
// account, the next "Login with GitHub" click silently re-auths to
// the same wrong account. This button wipes our half of that state
// and pops github.com/logout so you can sign out on their side too.
(function () {
  function makeButton() {
    if (document.getElementById("admin-reset-btn")) return;
    var btn = document.createElement("button");
    btn.id = "admin-reset-btn";
    btn.type = "button";
    btn.textContent = "Reset login";
    btn.title = "Clear stored login + sign out of GitHub";
    Object.assign(btn.style, {
      position: "fixed",
      top: "12px",
      right: "12px",
      zIndex: "2147483647",
      background: "#1c1400",
      color: "#ffd721",
      border: "1px solid #ffd721",
      padding: "8px 14px",
      font: '600 11px/1 system-ui, -apple-system, "Segoe UI", sans-serif',
      borderRadius: "999px",
      cursor: "pointer",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    });
    btn.addEventListener("mouseenter", function () {
      btn.style.background = "#ffd721";
      btn.style.color = "#1c1400";
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.background = "#1c1400";
      btn.style.color = "#ffd721";
    });
    btn.addEventListener("click", function () {
      var ok = window.confirm(
        "This will:\n\n" +
          "1. Clear all stored Decap CMS login data on this site\n" +
          "2. Clear cookies on this site\n" +
          "3. Open github.com/logout in a new tab so you can sign out of GitHub\n" +
          "4. Reload this admin page\n\n" +
          "After this: switch to the new tab, finish signing out of GitHub, then come back and log in with the correct account.\n\n" +
          "Continue?"
      );
      if (!ok) return;
      try {
        localStorage.clear();
      } catch (e) {}
      try {
        sessionStorage.clear();
      } catch (e) {}
      // Best-effort cookie wipe on THIS domain. (We can't touch
      // github.com cookies from here — that's why we also open
      // the logout URL below.)
      document.cookie.split(";").forEach(function (c) {
        var name = c.split("=")[0].trim();
        if (!name) return;
        var domains = ["", "." + location.hostname, location.hostname];
        var paths = ["/", location.pathname];
        domains.forEach(function (d) {
          paths.forEach(function (p) {
            document.cookie =
              name +
              "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=" +
              p +
              (d ? "; domain=" + d : "");
          });
        });
      });
      window.open("https://github.com/logout", "_blank", "noopener");
      // Reload the current admin path (works for /admin/, /book-admin/, etc.).
      setTimeout(function () {
        location.reload();
      }, 300);
    });
    document.body.appendChild(btn);
  }

  // Decap mounts into <body> and tears down what's there, so we
  // re-attach the button whenever the body's children change and
  // poll for the first 30s as a belt-and-suspenders.
  makeButton();
  try {
    new MutationObserver(makeButton).observe(document.body, {
      childList: true,
      subtree: false,
    });
  } catch (e) {}
  var start = Date.now();
  var iv = setInterval(function () {
    makeButton();
    if (Date.now() - start > 30000) clearInterval(iv);
  }, 500);
})();
