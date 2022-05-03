import { BigNumber } from 'bignumber.js';
import { Directive, ElementRef, HostListener, Input, OnChanges, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';
import { splice } from './share';

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
  isNegative = false;

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
    let keyCode = (e.keyCode ? e.keyCode : e.which);
    this.isNegative = false;
    const excepts = ['<', '>', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace', 'Delete']

    if ((keyCode < 48 || keyCode > 57) && !excepts.includes(e.key) && !(e.ctrlKey && (e.key === 'a' || e.key === 'A'))) {
      if (e.key === '-' && this.config.allowNegative === true) {
        this.isNegative = true;
      } else {
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'Backspace') {
      var element = this.el.nativeElement;
      const posStart = element.selectionStart;
      const idxOfDecimalPoint = element.value.indexOf(',');
      if (idxOfDecimalPoint !== -1 && idxOfDecimalPoint === (posStart - 1)) {
        this.setSectionRange(idxOfDecimalPoint, idxOfDecimalPoint);
      }
    }

    if (!(keyCode < 48 || keyCode > 57)) {
      var idxOfChar = e.target.selectionStart;
      var currentValue = splice(idxOfChar, e.target.value, e.key);

      var splitDecimals = currentValue.split(',');
      var lengthOfInt = splitDecimals[0].split('.').join('').length;
      if (lengthOfInt > (this.config.maxIntegerDigit || 0)) {
        e.preventDefault();
      }

      var length = e.target.value.length;
      if (splitDecimals.length > 1 && length === idxOfChar) {
        e.preventDefault();
      }
    }
  }

  @HostListener('keyup', ['$event']) onKeyup(e: any) {
    var element = this.el.nativeElement;

    let keyCode = (e.keyCode ? e.keyCode : e.which);
    if (keyCode === 188 || e.key === ',') {
      const pos = element.value.indexOf(',');
      this.setSectionRange(pos + 1, pos + 1);
    }
  }

  ngOnInit(): void {
    this.init();

    this.ngControl.valueChanges?.subscribe(() => {
      setTimeout(() => {
        var element = this.el.nativeElement;
        let posStart = element.selectionStart;
        let posEnd = element.selectionEnd;

        element.value = this.convertFromSetValue(element.value || 0);
        element.value = this.convertNegativeValue(element.value);
        const oldValue = element.value.toString().replaceAll('.', '').replaceAll(',', '.');
        const oldLength = element.value.toString().split('.').length - 1;

        var transFormValue = this.formatToCurrency(oldValue) as any;
        var numValue = this.stringToNumber(transFormValue);

        this.ngControl.control?.setValue(numValue, { emitEvent: false });
        element.value = transFormValue;
        element.style.textAlign = this.config.align;
        const newLength = element.value.toString().split('.').length - 1;
        let offset = newLength - oldLength;
        if (this.isNegative) {
          posStart = numValue < 0 ? posStart : (posStart - 2);
          posEnd = numValue < 0 ? posEnd : (posEnd - 2);

          this.setSectionRange(posStart, posEnd, 0, true);
        } else {
          this.setSectionRange(posStart, posEnd, offset);
        }
      }, 0);
    });
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
      element.value = this.formatToCurrency(element.value);
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

  convertNegativeValue(value: string) {
    const splitNegative = value.split('-');
    const length = splitNegative.length;
    if (length % 2 === 0) {
      return '-' + splitNegative.join('');
    }

    return splitNegative.join('');
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

  convertFromSetValue(value: string) {
    var bn = new BigNumber(value);
    if (!bn.isNaN()) {
      return this.formatToCurrency(value);
    }

    return value;
  }

  formatThousands(x: any) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
}
