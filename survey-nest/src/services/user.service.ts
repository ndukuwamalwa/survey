import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  static currentTimestamp(noTime = false): string {
    const val = new Date();
    const year = val.getFullYear();
    const month = val.getMonth() + 1;
    const day = val.getDate();
    const doubleDigits = (val: number) => {
      if (val > 9) {
        return val.toString();
      } else {
        return `0${val}`;
      }
    };
    const date = `${year}-${doubleDigits(month)}-${doubleDigits(day)}`;

    if (noTime) {
      return date;
    }
    const time = val.toTimeString().split(' ')[0];

    return `${date} ${time}`;
  }
}
