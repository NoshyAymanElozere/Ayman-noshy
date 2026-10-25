/**
 * Arabic Number to Words Converter (Tafqeet) for Egyptian Pounds (جنيه مصري)
 */

const ones = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
  'عشرة',
  'أحد عشر',
  'اثنا عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر',
];

const tens = [
  '',
  '',
  'عشرون',
  'ثلاثون',
  'أربعون',
  'خمسون',
  'ستون',
  'سبعون',
  'ثمانون',
  'تسعون',
];

const hundreds = [
  '',
  'مائة',
  'مائتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
];

function convertThreeDigits(num: number): string {
  if (num === 0) return '';

  const h = Math.floor(num / 100);
  const remainder = num % 100;
  let result = '';

  if (h > 0) {
    result += hundreds[h];
  }

  if (remainder === 0) {
    return result;
  }

  if (result !== '') {
    result += ' و';
  }

  if (remainder < 20) {
    result += ones[remainder];
  } else {
    const o = remainder % 10;
    const t = Math.floor(remainder / 10);
    if (o > 0) {
      result += ones[o] + ' و' + tens[t];
    } else {
      result += tens[t];
    }
  }

  return result;
}

export function numberToArabicWords(number: number): string {
  if (number === 0 || isNaN(number)) {
    return 'صفر جنيه مصري';
  }

  const integerPart = Math.floor(Math.abs(number));
  const decimalPart = Math.round((Math.abs(number) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return 'صفر جنيه مصري';
  }

  let words = '';

  if (integerPart > 0) {
    const billions = Math.floor(integerPart / 1000000000);
    const millions = Math.floor((integerPart % 1000000000) / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const units = integerPart % 1000;

    const parts: string[] = [];

    if (billions > 0) {
      if (billions === 1) parts.push('مليار');
      else if (billions === 2) parts.push('ملياران');
      else if (billions >= 3 && billions <= 10) parts.push(convertThreeDigits(billions) + ' مليارات');
      else parts.push(convertThreeDigits(billions) + ' مليار');
    }

    if (millions > 0) {
      if (millions === 1) parts.push('مليون');
      else if (millions === 2) parts.push('مليونان');
      else if (millions >= 3 && millions <= 10) parts.push(convertThreeDigits(millions) + ' ملايين');
      else parts.push(convertThreeDigits(millions) + ' مليون');
    }

    if (thousands > 0) {
      if (thousands === 1) parts.push('ألف');
      else if (thousands === 2) parts.push('ألفان');
      else if (thousands >= 3 && thousands <= 10) parts.push(convertThreeDigits(thousands) + ' آلاف');
      else parts.push(convertThreeDigits(thousands) + ' ألف');
    }

    if (units > 0) {
      parts.push(convertThreeDigits(units));
    }

    let poundsWord = 'جنيه مصري';
    if (integerPart === 1) {
      words = 'جنيه مصري واحد';
    } else if (integerPart === 2) {
      words = 'جنيهان مصريان';
    } else if (integerPart >= 3 && integerPart <= 10) {
      words = parts.join(' و') + ' جنيهات مصرية';
    } else {
      words = parts.join(' و') + ' ' + poundsWord;
    }
  }

  let piastersWord = '';
  if (decimalPart > 0) {
    const piastersConverted = convertThreeDigits(decimalPart);
    if (decimalPart === 1) {
      piastersWord = 'قرش واحد';
    } else if (decimalPart === 2) {
      piastersWord = 'قرشان';
    } else if (decimalPart >= 3 && decimalPart <= 10) {
      piastersWord = piastersConverted + ' قروش';
    } else {
      piastersWord = piastersConverted + ' قرشاً';
    }

    if (words !== '') {
      words += ' و' + piastersWord;
    } else {
      words = piastersWord;
    }
  }

  return `فقط ${words} لا غير`;
}
