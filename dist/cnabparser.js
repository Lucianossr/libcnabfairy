"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _momentTimezone = _interopRequireDefault(require("moment-timezone"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by Lucas Teske on 13/11/18.
 * 
 */
const BN = _bignumber.default.clone({
  DECIMAL_PLACES: 2,
  ROUNDING_MODE: 4
});

class CNABParser {
  constructor(lineLength = 240, startsWithOne = true, timezone = 'UTC') {
    this.types = [];
    this.lineLength = lineLength;
    this.startsWithOne = startsWithOne;
    this.started = false;
    this.currentType = -1;
    this.currentOptions = {};
    this.currentFields = [];
    this.timezone = timezone;
  }

  _checkFieldColision(options) {
    const {
      start,
      end,
      name
    } = options;
    const lineFields = this.currentFields;

    for (let i = 0; i < lineFields.length; i++) {
      const field = lineFields[i];

      if (start >= field.start && start <= field.end || end >= field.start && end <= field.end || field.name === name) {
        return true; // Field Colision
      }
    }

    return false;
  }

  start(type, options) {
    if (this.started) {
      throw new Error('A line type is already started. Please end it first.');
    }

    this.currentType = type;
    this.currentOptions = options;
    this.started = true;
    return this;
  }

  end() {
    if (!this.started) {
      throw new Error('There is no line type started. Please start one first.');
    }

    this.types.push({
      type: this.currentType,
      options: this.currentOptions,
      fields: this.currentFields
    });
    this.currentType = -1;
    this.currentOptions = {};
    this.currentFields = [];
    this.started = false;
    return this;
  }

  put(name, options) {
    const {
      start: s,
      end: e
    } = options;
    options.name = name;
    const start = this.startsWithOne ? s - 1 : s;
    const end = this.startsWithOne ? e : e + 1;

    if (end > this.lineLength) {
      throw new Error('Line exceeding max width');
    }

    const fieldLen = end - start;

    if (fieldLen <= 0) {
      throw new Error('Field length should be bigger than 0');
    }

    if (this._checkFieldColision(options)) {
      throw new Error('There is already a field in that position or with that name');
    }

    this.currentFields.push(options);
    return this;
  }

  _parseType(line, type) {
    const data = {};

    for (let i = 0; i < type.fields.length; i++) {
      const {
        name,
        start: s,
        end: e,
        type: otype
      } = type.fields[i];
      const start = this.startsWithOne ? s - 1 : s;
      const end = this.startsWithOne ? e : e + 1;
      let val = line.substr(start, end - start).trim();

      if (otype) {
        const dt = otype.split('|');
        const objectType = dt[0].trim();
        const format = dt.length > 1 ? dt[1].trim() : null;

        switch (objectType) {
          case 'number':
            val = parseInt(val, 10);
            break;

          case 'money':
            val = new BN(val).dividedBy(100).toNumber();
            break;

          case 'date':
            val = _momentTimezone.default.tz(val, format || 'DDMMYYYY', this.timezone);
            break;

          case 'time':
            val = _momentTimezone.default.tz(val, format || 'HHmmss', this.timezone);
            break;

          case 'datetime':
            val = _momentTimezone.default.tz(val, format || 'DDMMYYYYHHmmss', this.timezone);
            break;

          default: // Nothing

        }
      }

      data[name] = val;
    }

    return data;
  }

  _tryType(line, type) {
    const {
      start: s,
      end: e,
      type: otype
    } = type.options;
    const start = this.startsWithOne ? s - 1 : s;
    const end = this.startsWithOne ? e : e + 1;
    const segment = line.substr(start, end - start);
    let value;

    if (otype) {
      switch (otype) {
        case 'number':
          value = parseInt(segment, 10);
          break;

        case 'string':
          value = segment;
          break;

        default:
          value = null;
      }
    }

    if (value === type.type) {
      return this._parseType(line, type);
    }

    return null;
  }

  _parseLine(line, idx) {
    if (line.length !== this.lineLength) {
      throw new Error(`Line ${idx}: Invalid Width. Expected ${this.lineLength} got ${line.length}`);
    }

    let parsedLine = null;

    for (let i = 0; i < this.types.length; i++) {
      const type = this.types[i];
      parsedLine = this._tryType(line, type);

      if (parsedLine !== null) {
        break;
      }
    }

    if (parsedLine === null) {
      throw new Error(`Line ${idx}: No parser found for line.`);
    }

    let objLength = Object.keys(parsedLine).length;  // 0

    if(objLength == 0){
      return;
    }

    return parsedLine;
  }

  parse(data) {

    let dataParsed = data.replace(/\r/g, '').split('\n').filter(line => line.trim().length > 0).map((line, idx) => this._parseLine(line, idx));

    return dataParsed.filter(n => n);
  }

}

exports.default = CNABParser;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jbmFicGFyc2VyLmpzIl0sIm5hbWVzIjpbIkJOIiwiQmlnTnVtYmVyIiwiY2xvbmUiLCJERUNJTUFMX1BMQUNFUyIsIlJPVU5ESU5HX01PREUiLCJDTkFCUGFyc2VyIiwiY29uc3RydWN0b3IiLCJsaW5lTGVuZ3RoIiwic3RhcnRzV2l0aE9uZSIsInRpbWV6b25lIiwidHlwZXMiLCJzdGFydGVkIiwiY3VycmVudFR5cGUiLCJjdXJyZW50T3B0aW9ucyIsImN1cnJlbnRGaWVsZHMiLCJfY2hlY2tGaWVsZENvbGlzaW9uIiwib3B0aW9ucyIsInN0YXJ0IiwiZW5kIiwibmFtZSIsImxpbmVGaWVsZHMiLCJpIiwibGVuZ3RoIiwiZmllbGQiLCJ0eXBlIiwiRXJyb3IiLCJwdXNoIiwiZmllbGRzIiwicHV0IiwicyIsImUiLCJmaWVsZExlbiIsIl9wYXJzZVR5cGUiLCJsaW5lIiwiZGF0YSIsIm90eXBlIiwidmFsIiwic3Vic3RyIiwidHJpbSIsImR0Iiwic3BsaXQiLCJvYmplY3RUeXBlIiwiZm9ybWF0IiwicGFyc2VJbnQiLCJtb21lbnQiLCJ0eiIsIl90cnlUeXBlIiwic2VnbWVudCIsInZhbHVlIiwiX3BhcnNlTGluZSIsImlkeCIsInBhcnNlZExpbmUiLCJwYXJzZSIsInJlcGxhY2UiLCJmaWx0ZXIiLCJtYXAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFLQTs7QUFDQTs7OztBQU5BOzs7O0FBUUEsTUFBTUEsRUFBRSxHQUFHQyxtQkFBVUMsS0FBVixDQUFnQjtBQUFFQyxFQUFBQSxjQUFjLEVBQUUsQ0FBbEI7QUFBcUJDLEVBQUFBLGFBQWEsRUFBRTtBQUFwQyxDQUFoQixDQUFYOztBQUVlLE1BQU1DLFVBQU4sQ0FBaUI7QUFDOUJDLEVBQUFBLFdBQVcsQ0FBQ0MsVUFBVSxHQUFHLEdBQWQsRUFBbUJDLGFBQWEsR0FBRyxJQUFuQyxFQUF5Q0MsUUFBUSxHQUFHLEtBQXBELEVBQTJEO0FBQ3BFLFNBQUtDLEtBQUwsR0FBYSxFQUFiO0FBQ0EsU0FB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QWI7QUFDQThCLE1BQUFBLFVBQVUsR0FBRyxLQUFLTCxRQUFMLENBQWNiLElBQWQsRUFBb0JULElBQXBCLENBQWI7O0FBQ0EsVUFBSTJCLFVBQVUsS0FBSyxJQUFuQixFQUF5QjtBQUN2QjtBQUNEO0FBQ0Y7O0FBRUQsUUFBSUEsVUFBVSxLQUFLLElBQW5CLEVBQXlCO0FBQ3ZCLFlBQU0sSUFBSTFCLEtBQUosQ0FBVyxRQUFPeUIsR0FBSSw2QkFBdEIsQ0FBTjtBQUNEOztBQUVELFdBQU9DLFVBQVA7QUFDRDs7QUFFREMsRUFBQUEsS0FBSyxDQUFDbEIsSUFBRCxFQUFlO0FBQ2xCLFdBQU9BLElBQUksQ0FDUm1CLE9BREksQ0FDSSxLQURKLEVBQ1csRUFEWCxFQUVKYixLQUZJLENBRUUsSUFGRixFQUdKYyxNQUhJLENBR0dyQixJQUFJLElBQUlBLElBQUksQ0FBQ0ssSUFBTCxHQUFZaEIsTUFBWixHQUFxQixDQUhoQyxFQUlKaUMsR0FKSSxDQUlBLENBQUN0QixJQUFELEVBQU9pQixHQUFQLEtBQWUsS0FBS0QsVUFBTCxDQUFnQmhCLElBQWhCLEVBQXNCaUIsR0FBdEIsQ0FKZixDQUFQO0FBS0Q7O0FBdks2QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSBMdWNhcyBUZXNrZSBvbiAxMy8xMS8xOC5cbiAqIEBmbG93XG4gKi9cblxuaW1wb3J0IEJpZ051bWJlciBmcm9tICdiaWdudW1iZXIuanMnO1xuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQtdGltZXpvbmUnO1xuXG5jb25zdCBCTiA9IEJpZ051bWJlci5jbG9uZSh7IERFQ0lNQUxfUExBQ0VTOiAyLCBST1VORElOR19NT0RFOiA0IH0pO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDTkFCUGFyc2VyIHtcbiAgY29uc3RydWN0b3IobGluZUxlbmd0aCA9IDI0MCwgc3RhcnRzV2l0aE9uZSA9IHRydWUsIHRpbWV6b25lID0gJ1VUQycpIHtcbiAgICB0aGlzLnR5cGVzID0gW107XG4gICAgdGhpcy5saW5lTGVuZ3RoID0gbGluZUxlbmd0aDtcbiAgICB0aGlzLnN0YXJ0c1dpdGhPbmUgPSBzdGFydHNXaXRoT25lO1xuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgIHRoaXMuY3VycmVudFR5cGUgPSAtMTtcbiAgICB0aGlzLmN1cnJlbnRPcHRpb25zID0ge307XG4gICAgdGhpcy5jdXJyZW50RmllbGRzID0gW107XG4gICAgdGhpcy50aW1lem9uZSA9IHRpbWV6b25lO1xuICB9XG5cbiAgX2NoZWNrRmllbGRDb2xpc2lvbihvcHRpb25zKSB7XG4gICAgY29uc3QgeyBzdGFydCwgZW5kLCBuYW1lIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IGxpbmVGaWVsZHMgPSB0aGlzLmN1cnJlbnRGaWVsZHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lRmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBmaWVsZCA9IGxpbmVGaWVsZHNbaV07XG4gICAgICBpZiAoXG4gICAgICAgIChzdGFydCA+PSBmaWVsZC5zdGFydCAmJiBzdGFydCA8PSBmaWVsZC5lbmQpIHx8IChlbmQgPj0gZmllbGQuc3RhcnQgJiYgZW5kIDw9IGZpZWxkLmVuZCkgfHwgZmllbGQubmFtZSA9PT0gbmFtZVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBGaWVsZCBDb2xpc2lvblxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGFydCh0eXBlOiBudW1iZXIsIG9wdGlvbnMpIDogQ05BQlBhcnNlciB7XG4gICAgaWYgKHRoaXMuc3RhcnRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIGxpbmUgdHlwZSBpcyBhbHJlYWR5IHN0YXJ0ZWQuIFBsZWFzZSBlbmQgaXQgZmlyc3QuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50VHlwZSA9IHR5cGU7XG4gICAgdGhpcy5jdXJyZW50T3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGVuZCgpIDogQ05BQlBhcnNlciB7XG4gICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlcmUgaXMgbm8gbGluZSB0eXBlIHN0YXJ0ZWQuIFBsZWFzZSBzdGFydCBvbmUgZmlyc3QuJyk7XG4gICAgfVxuICAgIHRoaXMudHlwZXMucHVzaCh7XG4gICAgICB0eXBlOiB0aGlzLmN1cnJlbnRUeXBlLFxuICAgICAgb3B0aW9uczogdGhpcy5jdXJyZW50T3B0aW9ucyxcbiAgICAgIGZpZWxkczogdGhpcy5jdXJyZW50RmllbGRzLFxuICAgIH0pO1xuXG4gICAgdGhpcy5jdXJyZW50VHlwZSA9IC0xO1xuICAgIHRoaXMuY3VycmVudE9wdGlvbnMgPSB7fTtcbiAgICB0aGlzLmN1cnJlbnRGaWVsZHMgPSBbXTtcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHV0KG5hbWU6IHN0cmluZywgb3B0aW9ucykgOiBDTkFCUGFyc2VyIHtcbiAgICBjb25zdCB7XG4gICAgICBzdGFydDogcyxcbiAgICAgIGVuZDogZSxcbiAgICB9ID0gb3B0aW9ucztcblxuICAgIG9wdGlvbnMubmFtZSA9IG5hbWU7XG5cbiAgICBjb25zdCBzdGFydCA9IHRoaXMuc3RhcnRzV2l0aE9uZSA/IHMgLSAxIDogcztcbiAgICBjb25zdCBlbmQgPSB0aGlzLnN0YXJ0c1dpdGhPbmUgPyBlIDogZSArIDE7XG5cbiAgICBpZiAoZW5kID4gdGhpcy5saW5lTGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpbmUgZXhjZWVkaW5nIG1heCB3aWR0aCcpO1xuICAgIH1cblxuICAgIGNvbnN0IGZpZWxkTGVuID0gZW5kIC0gc3RhcnQ7XG5cbiAgICBpZiAoZmllbGRMZW4gPD0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaWVsZCBsZW5ndGggc2hvdWxkIGJlIGJpZ2dlciB0aGFuIDAnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY2hlY2tGaWVsZENvbGlzaW9uKG9wdGlvbnMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZXJlIGlzIGFscmVhZHkgYSBmaWVsZCBpbiB0aGF0IHBvc2l0aW9uIG9yIHdpdGggdGhhdCBuYW1lJyk7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50RmllbGRzLnB1c2gob3B0aW9ucyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9wYXJzZVR5cGUobGluZTogc3RyaW5nLCB0eXBlKSB7XG4gICAgY29uc3QgZGF0YSA9IHt9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlLmZpZWxkcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBuYW1lLCBzdGFydDogcywgZW5kOiBlLCB0eXBlOiBvdHlwZSxcbiAgICAgIH0gPSB0eXBlLmZpZWxkc1tpXTtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5zdGFydHNXaXRoT25lID8gcyAtIDEgOiBzO1xuICAgICAgY29uc3QgZW5kID0gdGhpcy5zdGFydHNXaXRoT25lID8gZSA6IGUgKyAxO1xuICAgICAgbGV0IHZhbCA9IGxpbmUuc3Vic3RyKHN0YXJ0LCBlbmQgLSBzdGFydCkudHJpbSgpO1xuXG4gICAgICBpZiAob3R5cGUpIHtcbiAgICAgICAgY29uc3QgZHQgPSBvdHlwZS5zcGxpdCgnfCcpO1xuICAgICAgICBjb25zdCBvYmplY3RUeXBlID0gZHRbMF0udHJpbSgpO1xuICAgICAgICBjb25zdCBmb3JtYXQgPSBkdC5sZW5ndGggPiAxID8gZHRbMV0udHJpbSgpIDogbnVsbDtcbiAgICAgICAgc3dpdGNoIChvYmplY3RUeXBlKSB7XG4gICAgICAgICAgY2FzZSAnbnVtYmVyJzogdmFsID0gcGFyc2VJbnQodmFsLCAxMCk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ21vbmV5JzogdmFsID0gKG5ldyBCTih2YWwpKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnZGF0ZSc6IHZhbCA9IG1vbWVudC50eih2YWwsIGZvcm1hdCB8fCAnRERNTVlZWVknLCB0aGlzLnRpbWV6b25lKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAndGltZSc6IHZhbCA9IG1vbWVudC50eih2YWwsIGZvcm1hdCB8fCAnSEhtbXNzJywgdGhpcy50aW1lem9uZSk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2RhdGV0aW1lJzogdmFsID0gbW9tZW50LnR6KHZhbCwgZm9ybWF0IHx8ICdERE1NWVlZWUhIbW1zcycsIHRoaXMudGltZXpvbmUpOyBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OiAvLyBOb3RoaW5nXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZGF0YVtuYW1lXSA9IHZhbDtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIF90cnlUeXBlKGxpbmU6IHN0cmluZywgdHlwZSkge1xuICAgIGNvbnN0IHsgc3RhcnQ6IHMsIGVuZDogZSwgdHlwZTogb3R5cGUgfSA9IHR5cGUub3B0aW9ucztcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuc3RhcnRzV2l0aE9uZSA/IHMgLSAxIDogcztcbiAgICBjb25zdCBlbmQgPSB0aGlzLnN0YXJ0c1dpdGhPbmUgPyBlIDogZSArIDE7XG5cbiAgICBjb25zdCBzZWdtZW50ID0gbGluZS5zdWJzdHIoc3RhcnQsIGVuZCAtIHN0YXJ0KTtcbiAgICBsZXQgdmFsdWU7XG5cbiAgICBpZiAob3R5cGUpIHtcbiAgICAgIHN3aXRjaCAob3R5cGUpIHtcbiAgICAgICAgY2FzZSAnbnVtYmVyJzogdmFsdWUgPSBwYXJzZUludChzZWdtZW50LCAxMCk7IGJyZWFrO1xuICAgICAgICBjYXNlICdzdHJpbmcnOiB2YWx1ZSA9IHNlZ21lbnQ7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OiB2YWx1ZSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlID09PSB0eXBlLnR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wYXJzZVR5cGUobGluZSwgdHlwZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBfcGFyc2VMaW5lKGxpbmU6IHN0cmluZywgaWR4OiBudW1iZXIpIHtcbiAgICBpZiAobGluZS5sZW5ndGggIT09IHRoaXMubGluZUxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBMaW5lICR7aWR4fTogSW52YWxpZCBXaWR0aC4gRXhwZWN0ZWQgJHt0aGlzLmxpbmVMZW5ndGh9IGdvdCAke2xpbmUubGVuZ3RofWApO1xuICAgIH1cblxuICAgIGxldCBwYXJzZWRMaW5lID0gbnVsbDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50eXBlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdHlwZSA9IHRoaXMudHlwZXNbaV07XG4gICAgICBwYXJzZWRMaW5lID0gdGhpcy5fdHJ5VHlwZShsaW5lLCB0eXBlKTtcbiAgICAgIGlmIChwYXJzZWRMaW5lICE9PSBudWxsKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwYXJzZWRMaW5lID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYExpbmUgJHtpZHh9OiBObyBwYXJzZXIgZm91bmQgZm9yIGxpbmUuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnNlZExpbmU7XG4gIH1cblxuICBwYXJzZShkYXRhOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZGF0YVxuICAgICAgLnJlcGxhY2UoL1xcci9nLCAnJylcbiAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgIC5maWx0ZXIobGluZSA9PiBsaW5lLnRyaW0oKS5sZW5ndGggPiAwKVxuICAgICAgLm1hcCgobGluZSwgaWR4KSA9PiB0aGlzLl9wYXJzZUxpbmUobGluZSwgaWR4KSk7XG4gIH1cbn1cbiJdfQ==