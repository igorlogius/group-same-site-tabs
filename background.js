/* global browser */

async function grpTabsBySite(all_tabs, sites) {
  sites.forEach((site) => {
    const tabIds = all_tabs
      .filter((t) => t.url.startsWith(site))
      .map((t) => t.id);
    browser.tabs.group({ tabIds });
  });
}

async function grpAllTabsBySite() {
  // 1. get all tabs
  const all_tabs = await browser.tabs.query({
    currentWindow: true,
    pinned: false,
    hidden: false,
  });

  const origin_tabIds = new Map(); // str => set(ints)

  all_tabs.forEach((t) => {
    if (typeof t.url !== "string" || !t.url.startsWith("http")) {
      return;
    }

    const t_urlobj = new URL(t.url);
    const t_origin = t_urlobj.origin;

    tmp = origin_tabIds.get(t_origin);

    if (!tmp) {
      tmp = new Set();
    }
    tmp.add(t.id);

    //
    origin_tabIds.set(t_origin, tmp);
  });

  // create the groups and move the tabs
  for (const [k, v] of origin_tabIds) {
    console.debug(k, v);
    const grpId = await browser.tabs.group({
      tabIds: [...v],
    });

    if (browser.tabGroups) {
      browser.tabGroups.update(grpId, {
        title: k,
      });
    }
  }
}

browser.menus.create({
  title: "This/These Tabs",
  contexts: ["tab"],
  onclick: async (clickdata, atab) => {
    const all_tabs = await browser.tabs.query({
      currentWindow: true,
      pinned: false,
      hidden: false,
    });

    if (!atab.highlighted) {
      const atab_origin = new URL(atab.url).origin;
      grpTabsBySite(all_tabs, [atab_origin]);
    } else {
      const sites = new Set(
        all_tabs.filter((t) => t.highlighted).map((t) => new URL(t.url).origin),
      );
      grpTabsBySite(all_tabs, [...sites]);
    }
  },
});

browser.menus.create({
  title: "All Tabs",
  contexts: ["tab"],
  onclick: async (clickdata, tab) => {
    grpAllTabsBySite();
  },
});
