// Disposable / temporary email domain blocklist.
// Sources: common temp-mail providers. Extend as needed.
const BLOCKED_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","guerrillamail.net","guerrillamail.org",
  "guerrillamail.biz","guerrillamail.de","guerrillamail.info","sharklasers.com",
  "guerrillamailblock.com","grr.la","spam4.me","yopmail.com","yopmail.fr",
  "cool.fr.nf","jetable.fr.nf","nospam.ze.tc","nomail.xl.cx","mega.zik.dj",
  "speed.1s.fr","courriel.fr.nf","moncourrier.fr.nf","monemail.fr.nf",
  "monmail.fr.nf","throwam.com","throwam.net","temp-mail.org","tempmail.com",
  "tempinbox.com","tempinbox.co.uk","mailnull.com","spam.la","fakemail.net",
  "spamgourmet.com","spamgourmet.net","spamgourmet.org","spamherelots.com",
  "spamhereplease.com","spamex.com","trashmail.at","trashmail.com","trashmail.io",
  "trashmail.me","trashmail.net","trashmail.org","trashmail.xyz","trashmailer.com",
  "trash-mail.at","trash-mail.com","trash-mail.io","dispostable.com","discard.email",
  "discardmail.com","discardmail.de","sharklasers.com","guerrillamail.info",
  "mailnesia.com","mailnull.com","throwam.com","maildrop.cc","mailsac.com",
  "getnada.com","nada.email","inboxkitten.com","spamgrap.com","fakeinbox.com",
  "sogetthis.com","mailfreeonline.com","getairmail.com","spamevader.com",
  "10minutemail.com","10minutemail.net","10minutemail.org","10minemail.com",
  "20minutemail.com","20minutemail.it","tmailinator.com","tempr.email",
  "discard.email","rtrtr.com","mvrht.com","trbvr.com","spamgrap.com",
  "spamdecoy.net","spambog.com","spambog.de","spambog.ru","spaml.com",
  "spaml.de","spammotel.com","spamnot.com","spamoff.de","spamspot.com",
  "spamstack.net","spamthis.co.uk","spamthisplease.com","spamtrail.com",
  "notmailinator.com","tempemail.net","tempemail.co","tempalemail.com",
  "tempail.com","fakemailgenerator.com","jetable.com","jetable.net","jetable.org",
  "kasmail.com","kaspop.com","klassmaster.com","kurzepost.de","lol.ovpn.to",
  "mt2009.com","mt2014.com","maileater.com","mailexpire.com","mailnew.com",
  "mailscrap.com","mailshell.com","mailsiphon.com","mailslite.com","mailzilla.org",
  "megahed.com","meltmail.com","momentics.ru","monovm.email","mytrashmail.com",
  "nospamfor.us","nowmymail.com","objectmail.com","odaymail.com","oneoffemail.com",
  "rejectmail.com","rppkn.com","s0ny.net","safe-mail.net","safetymail.info",
  "shitmail.me","shieldedmail.com","spamfree24.org","supergreatmail.com",
  "supermailer.jp","suremail.info","sweetxxx.de","tafmail.com","tagyourself.com",
  "teleworm.com","teleworm.us","tempalias.com","tempinbox.com","temporaryemail.net",
  "thankyou2010.com","thisisnotmyrealemail.com","throam.com","throwam.com",
  "throwam.net","trbvm.com","tyldd.com","uggsrock.com","veryrealemail.com",
  "viditag.com","vipmail.name","webm4il.info","webemail.me","weg-werf-email.de",
  "wegwerfadresse.de","wegwerfemail.com","wegwerfemail.de","wegwerfemail.net",
  "wegwerfemail.org","wegwerfmail.de","wegwerfmail.net","wegwerfmail.org",
  "wh4f.org","whyspam.me","willhackforfood.biz","willselfdestruct.com",
  "wilemail.com","xagloo.co","xagloo.com","xemaps.com","xents.com",
  "xmaily.com","xoxy.net","xyz.am","yapped.net","yepmail.net","yert.ye.vc",
  "yogamaven.com","youmail.ga","yppm.ru","yuurok.com","z1p.biz","zebins.com",
  "zebins.eu","zehnminuten.de","zipsendtest.com","zoemail.net","zomg.info",
]);

/**
 * Returns true if the email domain is a known disposable / temp-mail provider.
 * Case-insensitive. Checks exact domain and one-level subdomain stripping.
 */
export function isDisposableEmail(email: string): boolean {
  const lower  = email.toLowerCase().trim();
  const atIdx  = lower.lastIndexOf("@");
  if (atIdx < 0) return false;
  const domain = lower.slice(atIdx + 1);
  if (BLOCKED_DOMAINS.has(domain)) return true;
  // Check for subdomain variants like user@mail.mailinator.com
  const parts = domain.split(".");
  if (parts.length > 2) {
    const root = parts.slice(-2).join(".");
    if (BLOCKED_DOMAINS.has(root)) return true;
  }
  return false;
}

/** Validates email format AND rejects disposable providers. */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const clean = email.trim().toLowerCase();
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean) || clean.length > 254) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  if (isDisposableEmail(clean)) {
    return {
      valid: false,
      error: "Temporary and disposable email addresses are not allowed. Please use your personal email.",
    };
  }
  return { valid: true };
}
