import { BigNumber } from 'bignumber.js';
import { Directive, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output } from '@angular/core';
import { NgControl } from '@angular/forms';

interface Options {
  align?: string;
  allowNegative?: boolean;
  precision?: number;
  maxIntegerDigit?: number;
}

@Directive({
  selector: '[appCurrencyMask]'
})
export class CurrencyMaskDirective implements OnInit, OnChanges {
  @Input() options: Options = {};
  @Output() changeValueEvent: EventEmitter<string> = new EventEmitter<string>()
  isFocused = false;

  constructor(private el: ElementRef, private ngControl: NgControl) { }

  @HostListener('click', ['$event']) onClick(e: any) {
    var element = this.el.nativeElement;
    const posStart = element.selectionStart;
    const posEnd = element.selectionEnd;
    const value = element.value;

    if (!this.isFocused && posStart === 0 && posEnd === 0) {
      const idxOfDecimal = value.indexOf(',');
      if (idxOfDecimal !== -1) {
        this.setSectionRange(idxOfDecimal, idxOfDecimal);
      } else {
        this.setSectionRange(value.length, value.length);
      }
    }

    this.isFocused = true;
  }

  @HostListener('blur') onMousedown() {
    this.isFocused = false;
  }

  @HostListener('keydown', ['$event']) onKeydown(e: any) {
    var element = this.el.nativeElement;
    const posStart = element.selectionStart;
    const posEnd = element.selectionEnd;
    const value = element.value;
    let isSelectAll = false;
    let isNegative = false;
    const excepts = ['<', '>', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace', 'Delete'];
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    // Nếu không là số và không thuộc excepts và không là ctr + a
    if (!numbers.includes(e.key) && !excepts.includes(e.key) && !(e.ctrlKey && (e.key === 'a' || e.key === 'A' || e.key === 'v' || e.key === 'V'))) {
      // Nếu nhập '.' và config cho phép nhập âm
      if (e.key === '-' && this.options.allowNegative === true) {
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
        this.changeValueEvent.emit(element.value);
        const pos = isNegative ? (posStart + 1) : (posStart - 1);
        this.setSectionRange(pos, pos);

        e.preventDefault();
      } else {
        e.preventDefault();
        return;
      }
    }

    if (posStart === 0 && posEnd === value.length) {
      isSelectAll = true;
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
      if (isSelectAll) {
        currentValue = '0';
      } else {
        // Nếu bôi từng phần
        if (posStart !== posEnd) {
          currentValue = this.removeAt(value, posStart, posEnd - posStart - 1);
          element.selectionStart = 0;
          element.selectionEnd = 0;
        } else { // không bôi
          const pos = posStart - (isDeleteDecimalPoint ? 2 : 1);
          currentValue = this.removeAt(value, pos);
          element.selectionStart = pos;
          element.selectionEnd = pos;
        }
      }

      this.setValue(element, currentValue, false);
      this.changeValueEvent.emit(element.value);
      e.preventDefault();
    }

    // Nếu nhập số
    if (numbers.includes(e.key)) {
      var currentValue = this.splice(posStart, value, e.key);

      // Nếu số lượng chữ số phần nguyên > số lượng cấu hình thì block
      var splitDecimals = currentValue.split(',');
      var lengthOfInt = splitDecimals[0].split('.').join('').length;
      if (lengthOfInt > (this.options.maxIntegerDigit || 0) && !isSelectAll) {
        e.preventDefault();
        return;
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
          this.changeValueEvent.emit(element.value);
          this.setSectionRange(posStart + 1, posStart + 1);
          e.preventDefault();
        } else {
          if (isSelectAll) {
            currentValue = e.key;
          } else {
            element.value = currentValue;
          }

          let selectionIndex = posStart + (posEnd === value.length ? currentValue.length : 1);

          const integerNumber = currentValue.split(',')[0];
          if (integerNumber.length === 2 && integerNumber.charAt(0) === '0') { // TH: 03,XXX
            selectionIndex -= 1;
          }

          element.selectionStart = selectionIndex;
          element.selectionEnd = selectionIndex;

          this.setValue(element, currentValue, false);
          this.changeValueEvent.emit(element.value);
          e.preventDefault();
        }
      }
    }
  }

  @HostListener('keyup', ['$event']) onKeyup(e: any) {
    var element = this.el.nativeElement;
    // Nếu nhập ',' thì dịch trỏ chuột đến số đầu tiên phần thập phân
    if (e.key === ',' && element.value.indexOf(',') !== -1) {
      const pos = element.value.indexOf(',');
      this.setSectionRange(pos + 1, pos + 1);
    }
  }

  ngOnInit(): void {
    this.init();
    
    // setTimeout(() => {
    //   this.subscr = this.ngControl.valueChanges.subscribe((res: any) => {
    //     var element = this.el.nativeElement;
    //     this.setValue(element, element.value, typeof res === 'number');
    //   });
    // }, 0);
  }

  ngDoCheck(): void {
    this.init();
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
    element.style.textAlign = this.options.align;
    const newLength = element.value.toString().split('.').length - 1;

    let offset = newLength - oldLength;
    if (isEmpty || Math.floor(numValue).toString().length === 1 && posStart === 0 && posEnd === 0) {
      posStart = 1;
      posEnd = 1;
    }

    this.setSectionRange(posStart, posEnd, offset);
  }

  ngOnChanges(changes: any): void {
    const inputConfig = changes.options.currentValue;
    if (inputConfig) {
      this.options = {
        align: inputConfig.align || 'right',
        allowNegative: inputConfig.allowNegative == undefined ? true : inputConfig.allowNegative,
        precision: inputConfig.precision || 0,
        maxIntegerDigit: inputConfig.maxIntegerDigit || 15
      };
    }
  }

  init() {
    // setTimeout(() => {
      var element = this.el.nativeElement;
      var value = this.ngControl.value || 0;
      element.value = this.formatToCurrency(value);
      element.style.textAlign = this.options.align;
    // }, 0);
  }

  formatToCurrency(value: any) {
    var bn = new BigNumber(value);
    const parts = bn.toFormat(this.options.precision || 0, { decimalSeparator: '.' }).split('.');
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

  removeAt(source: any, index: any, length = 0): any {
    return source.slice(0, index) + source.slice(index + length + 1);
  }

  replaceAt(source: string, index: number, replacement: string) {
    return source.substring(0, index) + replacement + source.substring(index + 1);
  }
}
