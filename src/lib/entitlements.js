/**
 * ENTITLEMENTS ENGINE
 * ------------------------------------------------------------------
 * Generic, data-driven calculator. It knows two models and reads
 * everything else (bands, caps, exemptions) from the region ruleset:
 *
 *  - "service-bands"   (Australia-style): weeks of pay looked up from
 *                       a table of continuous-service bands.
 *  - "age-multiplier"  (UK-style): walk back through each year of
 *                       service, apply a multiplier based on the age
 *                       the person was during that year, cap service
 *                       years and weekly pay.
 *
 * A new country that fits either model needs ZERO code. just data.
 * A structurally different regime (e.g. US at-will) gets a new model
 * branch here, behind the same interface.
 *
 * Output is always { noticeWeeks, redundancyWeeks, redundancyPay,
 * noticePay, cappedWeeklyPay, qualifies, messages[] } so the UI never
 * needs region-specific logic.
 */

export function calculateNotice(rules, yearsOfService, age) {
  let weeks = 0;
  for (const band of rules.noticeBands) {
    if (band.maxYears === null || yearsOfService < band.maxYears) {
      if (band.weeksPerYear) {
        weeks = Math.min(Math.floor(yearsOfService) * band.weeksPerYear, band.maxWeeks || Infinity);
      } else {
        weeks = band.weeks;
      }
      break;
    }
  }
  const bonus = rules.noticeAgeBonus;
  if (bonus && age >= bonus.minAge && yearsOfService >= bonus.minYears) {
    weeks += bonus.extraWeeks;
  }
  return weeks;
}

export function calculateRedundancy(rules, { yearsOfService, age, weeklyPay, smallBusiness }) {
  const messages = [];

  if (yearsOfService < (rules.qualifyingYears || 0)) {
    return {
      qualifies: false,
      redundancyWeeks: 0,
      redundancyPay: 0,
      messages: [
        `You need at least ${rules.qualifyingYears} year${rules.qualifyingYears > 1 ? 's' : ''} of continuous service to qualify for statutory redundancy pay. Notice and accrued leave still apply.`
      ]
    };
  }

  if (rules.smallBusinessExemption?.applies && smallBusiness) {
    return {
      qualifies: false,
      redundancyWeeks: 0,
      redundancyPay: 0,
      messages: [rules.smallBusinessExemption.note]
    };
  }

  let cappedWeeklyPay = weeklyPay;
  if (rules.weeklyPayCap && weeklyPay > rules.weeklyPayCap) {
    cappedWeeklyPay = rules.weeklyPayCap;
    messages.push(
      `Your weekly pay is above the statutory cap, so the calculation uses the capped figure of ${rules.weeklyPayCap} per week.`
    );
  }

  let redundancyWeeks = 0;

  if (rules.redundancyModel === 'service-bands') {
    const fullYears = Math.floor(yearsOfService);
    for (const band of rules.redundancyBands) {
      const inBand =
        fullYears >= band.minYears && (band.maxYears === null || fullYears < band.maxYears);
      if (inBand) {
        redundancyWeeks = band.weeks;
        break;
      }
    }
  } else if (rules.redundancyModel === 'age-multiplier') {
    const countedYears = Math.min(Math.floor(yearsOfService), rules.maxServiceYears || Infinity);
    // Walk backwards through each counted year of service; the multiplier
    // depends on the age attained during that year (most recent year first,
    // matching the GOV.UK statutory method). Bands use exclusive maxAge:
    // e.g. maxAge 41 covers ages 22–40; 41 itself falls into the next band.
    for (let i = 0; i < countedYears; i++) {
      const ageDuringYear = age - i; // age attained in that service year, most recent first
      let multiplier = 0;
      for (const band of rules.ageMultipliers) {
        if (band.maxAge === null || ageDuringYear < band.maxAge) {
          multiplier = band.multiplier;
          break;
        }
      }
      redundancyWeeks += multiplier;
    }
  }

  return {
    qualifies: true,
    redundancyWeeks,
    redundancyPay: redundancyWeeks * cappedWeeklyPay,
    cappedWeeklyPay,
    messages
  };
}

export function calculateAll(rules, input) {
  const noticeWeeks = calculateNotice(rules, input.yearsOfService, input.age);
  const redundancy = calculateRedundancy(rules, input);
  return {
    noticeWeeks,
    noticePay: noticeWeeks * input.weeklyPay,
    ...redundancy
  };
}
