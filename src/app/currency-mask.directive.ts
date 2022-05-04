import { BigNumber } from 'bignumber.js';
import { Directive, ElementRef, HostListener, Input, OnChanges, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

interface Config {
  align?: string;
  allowNegative?: boolean;
  precision?: number;
  maxIntegerDigit?: number;
}

@Directive({
  selector: '[appCurrencyMask]'
})
export class CurrencyMaskDirective implements OnInit, OnChanges {
  @Input() config: Config = {};

  constructor(private el: ElementRef, private ngControl: NgControl) { }

  @HostListener('focus', ['$event']) onFocus(e: any) {
    // var value = e.target.value;
    // this.setSectionRange(0, value.length);
  }

  @HostListener('mousedown') onMousedown() {
    // var element = this.el.nativeElement;
    // const posStart = element.selectionStart;
    // const posEnd = element.selectionEnd;
    // const length = element.value.length;

    // if (posStart === 0 && posEnd === length) {
    //   this.setSectionRange(0, 0);
    // }
  }

  @HostListener('keydown', ['$event']) onKeydown(e: any) {
    var element = this.el.nativeElement;
    const posStart = element.selectionStart;
    const posEnd = element.selectionEnd;
    const value = element.value;
    const keyCode = (e.keyCode ? e.keyCode : e.which);
    let isNegative = false;
    const excepts = ['<', '>', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace', 'Delete'];

    // Nếu không là số và không thuộc excepts và không là ctr + a
    if (!((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105)) && !excepts.includes(e.key) && !(e.ctrlKey && (e.key === 'a' || e.key === 'A'))) {
      // Nếu nhập '.' và config cho phép nhập âm
      if (e.key === '-' && this.config.allowNegative === true) {
        let negativeValue = '';

        // Ẩn/hiện dấu âm
        var isNegativeNumber = value.indexOf('-');
        if (isNegativeNumber === 0) {
          negativeValue = value.substring(1);
        } else {
          negativeValue = '-' + value;
          isNegative = true;
        }

        // set value
        var numValue = this.stringToNumber(negativeValue);
        this.ngControl.control?.setValue(numValue, { emitEvent: false });
        element.value = negativeValue;
        const pos = isNegative ? (posStart + 1) : (posStart - 1);
        this.setSectionRange(pos, pos);

        e.preventDefault();
      } else {
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'Backspace') {
      let isDeleteDecimalPoint = false;
      // Nếu xóa dấu ngăn cách thập phân thì bỏ qua và xóa chữ số trước dấu ngăn cách thập phân
      const idxOfDecimalPoint = element.value.indexOf(',');
      if (idxOfDecimalPoint !== -1 && idxOfDecimalPoint === (posStart - 1)) {
        this.setSectionRange(idxOfDecimalPoint, idxOfDecimalPoint);
        isDeleteDecimalPoint = true;
      }
      
      let currentValue = '';
      // Nếu đang bôi tất cả và xóa thì về 0
      if (posStart === 0 && posEnd === value.length) {
        currentValue = '0';
      } else {
        // xóa từng số
        const pos = posStart - (isDeleteDecimalPoint ? 2 : 1);
        currentValue = this.removeAt(value, pos);
        element.selectionStart = pos;
        element.selectionEnd = pos;
      }
      
      this.setValue(element, currentValue, false);

      e.preventDefault();
    }

    // Nếu nhập số
    if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105)) {
      var currentValue = this.splice(posStart, value, e.key);

      // Nếu số lượng chữ số phần nguyên > số lượng cấu hình thì block
      var splitDecimals = currentValue.split(',');
      var lengthOfInt = splitDecimals[0].split('.').join('').length;
      if (lengthOfInt > (this.config.maxIntegerDigit || 0)) {
        e.preventDefault();
      }

      var length = value.length;
      // Nếu trỏ chuột đặt ở cuối phần thập phân thì không nhập nữa
      if (splitDecimals.length > 1 && length === posStart) {
        e.preventDefault();
      } else {
        const decimalPosition = value.indexOf(',');

        // Nhập phần thập phân
        if (decimalPosition !== -1 && posStart > decimalPosition) {
          var currentValue = this.typeDecimalPlace(value, posStart, e.key);
          var numValue = this.stringToNumber(currentValue);
          this.ngControl.control?.setValue(numValue, { emitEvent: false });
          element.value = currentValue;
          this.setSectionRange(posStart + 1, posStart + 1);
          e.preventDefault();
        } else {
          element.value = currentValue;
          element.selectionStart = posStart + (posEnd === value.length ? currentValue.length : 1);
          element.selectionEnd = posStart + (posEnd === value.length ? currentValue.length : 1);
          this.setValue(element, currentValue, false);
          e.preventDefault();
        }
      }
    }
  }

  @HostListener('keyup', ['$event']) onKeyup(e: any) {
    var element = this.el.nativeElement;
    let keyCode = (e.keyCode ? e.keyCode : e.which);

    // Nếu nhập ',' thì dịch trỏ chuột đến số đầu tiên phần thập phân
    if ((keyCode === 188 || e.key === ',') && element.value.indexOf(',') !== -1) {
      const pos = element.value.indexOf(',');
      this.setSectionRange(pos + 1, pos + 1);
    }
  }

  ngOnInit(): void {
    this.init();

    this.ngControl.valueChanges?.subscribe((res: any) => {
      setTimeout(() => {
        var element = this.el.nativeElement;
        this.setValue(element, element.value, typeof res === 'number');
      }, 0);
    });
  }

  setValue(element: any, value: any, isNumber: boolean) {
    let posStart = element.selectionStart;
    let posEnd = element.selectionEnd;

    var isEmpty = !value;

    const oldLength = value.toString().split('.').length - 1;
    value = this.formatCurrencyFromSetValue(value || '0', isNumber);
    const oldValue = value.toString().replaceAll('.', '').replaceAll(',', '.');

    var transFormValue = this.formatToCurrency(oldValue) as any;
    var numValue = this.stringToNumber(transFormValue);

    this.ngControl.control?.setValue(numValue, { emitEvent: false });
    element.value = transFormValue;
    element.style.textAlign = this.config.align;
    const newLength = element.value.toString().split('.').length - 1;

    let offset = newLength - oldLength;
    if (isEmpty || Math.floor(numValue).toString().length === 1) {
      posStart = 1;
      posEnd = 1;
    }

    this.setSectionRange(posStart, posEnd, offset);
  }

  ngOnChanges(changes: any): void {
    const inputConfig = changes.config.currentValue;
    this.config = {
      align: inputConfig.align || 'right',
      allowNegative: inputConfig.allowNegative == undefined ? true : inputConfig.allowNegative,
      precision: inputConfig.precision || 0,
      maxIntegerDigit: inputConfig.maxIntegerDigit || 15
    };
  }

  init() {
    setTimeout(() => {
      var element = this.el.nativeElement;
      // element.value = this.formatToCurrency(element.value);
      element.style.textAlign = this.config.align;
    }, 0);
  }

  formatToCurrency(value: any) {
    var bn = new BigNumber(value);
    const parts = bn.toFormat(this.config.precision || 0, { decimalSeparator: '.' }).split('.');
    parts[0] = this.formatThousands(parts[0]);
    return parts.join(',');
  }

  stringToNumber(value: any) {
    value = value.toString().replaceAll('.', '').replaceAll(',', '.');
    var bn = new BigNumber(value);
    return bn.toNumber();
  }

  setSectionRange(posStart: number, posEnd: number, offset: number = 0, keepSeletion = false) {
    var element = this.el.nativeElement;

    if (keepSeletion === true) {
      element.selectionStart = posStart;
      element.selectionEnd = posEnd;
    } else {
      element.selectionStart = +posStart + (posStart + offset < 0 ? 0 : offset);
      element.selectionEnd = +posEnd + (posEnd + offset < 0 ? 0 : offset);
    }
  }

  formatCurrencyFromSetValue(value: any, isSetValue: boolean) {
    var bn = new BigNumber(value);
    if (!bn.isNaN()) {
      if (!isSetValue) {
        value = value.replaceAll('.', '');
      }

      return this.formatToCurrency(value);
    }

    return value;
  }

  typeDecimalPlace(source: string, index: number, char: string) {
    var result = source.slice(0, -1);
    return this.splice(index, result, char);
  }

  formatThousands(x: any) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  splice(idx: any, source: any, value: any): any {
    return `${source.slice(0, idx)}${value}${source.slice(idx)}`;
  }

  removeAt(source: any, index: any): any {
    return source.slice(0, index) + source.slice(index + 1);
  }

  replaceAt(source: string, index: number, replacement: string) {
    return source.substring(0, index) + replacement + source.substring(index + 1);
  }
}
