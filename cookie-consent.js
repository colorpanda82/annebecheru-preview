(function (w, d) {
  'use strict';
  var KEY = 'bnm_consent_v1';
  var tag = d.currentScript || d.querySelector('script[data-bnm-consent]');
  var data = (tag && tag.dataset) || {};
  var GA_ID = data.gaId || w.__BNM_GA_ID || '';
  var CLARITY_ID = data.clarityId || w.__BNM_CLARITY_ID || '';
  var POSTHOG_KEY = data.posthogKey || w.__BNM_POSTHOG_KEY || '';
  var POSTHOG_HOST = data.posthogHost || w.__BNM_POSTHOG_HOST || 'https://eu.i.posthog.com';
  var HTML = [
    '<div id="cookie-banner" role="dialog" aria-modal="false" aria-label="Cookie preferences" aria-live="polite">',
      '<div class="cb-inner">',
        '<div class="cb-row">',
          '<div class="cb-copy">',
            '<strong>Cookie preferences</strong>',
            '<p>We use analytics and marketing cookies to understand how visitors find and use this site.',
            ' Essential cookies are always active.',
            ' <a href="/annebecheru-preview/privacy/">Privacy &amp; Cookie Policy</a></p>',
          '</div>',
          '<div class="cb-btns">',
            '<button type="button" class="cb-btn-manage" id="cb-manage-btn" aria-expanded="false"',
            '  data-cc="manage">Manage preferences</button>',
            '<button type="button" class="cb-btn cb-btn-reject" data-cc="reject">Reject all</button>',
            '<button type="button" class="cb-btn cb-btn-accept" data-cc="accept">Accept all</button>',
          '</div>',
        '</div>',
        '<div class="cb-prefs" id="cb-prefs">',
          '<div class="cb-prefs-title">Cookie categories</div>',
          '<div class="cb-cat">',
            '<div class="cb-cat-info">',
              '<h5>Essential</h5>',
              '<p>Required for the site to work. Includes your cookie consent choice and display preferences',
              ' (e.g. light or dark mode). These cannot be turned off.</p>',
            '</div>',
            '<label class="cb-toggle" aria-label="Essential cookies — always on">',
              '<input type="checkbox" checked disabled/>',
              '<span class="cb-slider"></span>',
            '</label>',
          '</div>',
          '<div class="cb-cat">',
            '<div class="cb-cat-info">',
              '<h5>Analytics</h5>',
              '<p>Helps us understand how visitors find and navigate this site, pages visited, time on site,',
              ' traffic sources, and anonymized session recordings. It also decides which version of a page',
              ' you see when we are testing two. Powered by Google Analytics, Microsoft Clarity and PostHog',
              ' (processed in the EU). No personal data is sold or shared with advertisers.</p>',
            '</div>',
            '<label class="cb-toggle" aria-label="Analytics cookies">',
              '<input type="checkbox" id="cb-analytics"/>',
              '<span class="cb-slider"></span>',
            '</label>',
          '</div>',
          '<div class="cb-cat">',
            '<div class="cb-cat-info">',
              '<h5>Marketing</h5>',
              '<p>Tracks form submissions and lead sources so we can follow up on audit requests you submit.',
              ' Powered by Google Analytics. No data is shared with third-party advertisers.</p>',
            '</div>',
            '<label class="cb-toggle" aria-label="Marketing cookies">',
              '<input type="checkbox" id="cb-marketing"/>',
              '<span class="cb-slider"></span>',
            '</label>',
          '</div>',
          '<div class="cb-prefs-footer">',
            '<button type="button" class="cb-btn cb-btn-reject" data-cc="reject">Reject all</button>',
            '<button type="button" class="cb-btn cb-btn-accept" data-cc="save">Save preferences</button>',
          '</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
  var CC = {
    stored: function () {
      try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
    },
    _save: function (prefs) {
      localStorage.setItem(KEY, JSON.stringify({
        analytics: !!prefs.analytics,
        marketing: !!prefs.marketing,
        ts: Date.now()
      }));
      this._apply(prefs);
      this._hide();
    },
    _apply: function (prefs) {
      var GA_CONFIGURED = GA_ID && GA_ID.indexOf('XXXXXXXXXX') === -1;
      if ((prefs.analytics || prefs.marketing) && GA_CONFIGURED && !d.getElementById('ga4-loader')) {
        var s = d.createElement('script');
        s.id = 'ga4-loader';
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        d.head.appendChild(s);
        w.dataLayer = w.dataLayer || [];
        function gtag(){ w.dataLayer.push(arguments); }
        w.gtag = gtag;
        gtag('js', new Date());
        gtag('consent', 'default', {
          ad_storage: prefs.marketing ? 'granted' : 'denied',
          ad_user_data: prefs.marketing ? 'granted' : 'denied',
          ad_personalization: prefs.marketing ? 'granted' : 'denied',
          analytics_storage: prefs.analytics ? 'granted' : 'denied'
        });
        gtag('config', GA_ID, { anonymize_ip: true });
      }
      if (prefs.analytics && CLARITY_ID && !d.getElementById('clarity-loader')) {
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.id='clarity-loader';t.src='https://www.clarity.ms/tag/'+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(w, d, 'clarity', 'script', CLARITY_ID);
      }
      if (prefs.analytics && POSTHOG_KEY && !d.getElementById('posthog-loader')) {
        var ph = d.createElement('script');
        ph.id = 'posthog-loader';
        ph.async = true;
        ph.src = POSTHOG_HOST + '/static/array.js';
        ph.onload = function () {
          if (!w.posthog || typeof w.posthog.init !== 'function') return;
          w.posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            persistence: 'localStorage+cookie',
            disable_session_recording: true,
            disable_surveys: true,
            capture_pageview: true
          });
          var queued = w.__bnmTrackQueue || [];
          for (var i = 0; i < queued.length; i++) {
            w.posthog.capture(queued[i][0], queued[i][1]);
          }
          w.__bnmTrackQueue = [];
        };
        d.head.appendChild(ph);
      }
    },
    _show: function () {
      var b = d.getElementById('cookie-banner');
      if (!b) return;
      b.classList.add('cb-show');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { b.classList.add('cb-visible'); });
      });
    },
    _hide: function () {
      var b = d.getElementById('cookie-banner');
      if (!b) return;
      b.classList.remove('cb-visible');
      setTimeout(function () { b.classList.remove('cb-show'); }, 450);
    },
    togglePrefs: function () {
      var p = d.getElementById('cb-prefs');
      var btn = d.getElementById('cb-manage-btn');
      if (!p) return;
      var open = p.classList.toggle('cb-open');
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    },
    acceptAll: function () {
      var a = d.getElementById('cb-analytics');
      var m = d.getElementById('cb-marketing');
      if (a) a.checked = true;
      if (m) m.checked = true;
      this._save({ analytics: true, marketing: true });
    },
    rejectAll: function () {
      var a = d.getElementById('cb-analytics');
      var m = d.getElementById('cb-marketing');
      if (a) a.checked = false;
      if (m) m.checked = false;
      this._save({ analytics: false, marketing: false });
    },
    savePrefs: function () {
      var a = d.getElementById('cb-analytics');
      var m = d.getElementById('cb-marketing');
      this._save({
        analytics: a ? a.checked : false,
        marketing: m ? m.checked : false
      });
    },
    reopen: function () {
      var stored = this.stored();
      var a = d.getElementById('cb-analytics');
      var m = d.getElementById('cb-marketing');
      if (stored) {
        if (a) a.checked = !!stored.analytics;
        if (m) m.checked = !!stored.marketing;
      }
      var p = d.getElementById('cb-prefs');
      var btn = d.getElementById('cb-manage-btn');
      if (p && !p.classList.contains('cb-open')) {
        p.classList.add('cb-open');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      }
      this._show();
    },
    init: function () {
      var stored = this.stored();
      if (stored) {
        this._apply(stored); 
      } else {
        var self = this;
        setTimeout(function () { self._show(); }, 700);
      }
    }
  };
  w.CookieConsent = CC;
  w.__bnmTrackQueue = w.__bnmTrackQueue || [];
  w.bnmTrack = function bnmTrack(name, props) {
    props = props || {};
    if (w.posthog && typeof w.posthog.capture === 'function') {
      w.posthog.capture(name, props);
    } else if (POSTHOG_KEY) {
      w.__bnmTrackQueue.push([name, props]);
    }
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, { event_category: 'engagement', transport_type: 'beacon' });
    }
    if (typeof w.clarity === 'function') {
      w.clarity('event', name);
    }
  };
  var pending = w.__bnmPending || [];
  for (var q = 0; q < pending.length; q++) {
    w.bnmTrack(pending[q][0], pending[q][1]);
  }
  w.__bnmPending = [];
  function boot() {
    var wrap = d.createElement('div');
    wrap.innerHTML = HTML;
    d.body.appendChild(wrap.firstElementChild);
    var ACTIONS = {
      manage: function () { CC.togglePrefs(); },
      reject: function () { CC.rejectAll(); },
      accept: function () { CC.acceptAll(); },
      save: function () { CC.savePrefs(); }
    };
    var hooks = d.querySelectorAll('#cookie-banner [data-cc]');
    for (var i = 0; i < hooks.length; i++) {
      (function (el) {
        var fn = ACTIONS[el.getAttribute('data-cc')];
        if (fn) el.addEventListener('click', fn);
      })(hooks[i]);
    }
    CC.init();
  }
  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window, document);
