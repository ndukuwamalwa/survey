import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  static readonly SESS_TOKEN_KEY = 'gaja2y288178917s';
  private jwtService = new JwtHelperService();

  constructor(
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const sessionActive = this.sessionIsActive();
      if (route.url.length === 0) {
        // Login Page
        if (sessionActive) {
          this.router.navigate(['upload-data']);
          return false;
        } else {
          return true;
        }
      } else {
        if (sessionActive) {
          return true;
        } else {
          this.router.navigateByUrl('/');
          return false;
        }
      }
  }

  sessionIsActive(): boolean {
    let returnValue = false;
    const token = window.sessionStorage.getItem(AuthGuard.SESS_TOKEN_KEY);
    if (!token) {
      returnValue = false;
    } else {
      returnValue = !this.jwtService.isTokenExpired(token);
    }

    return returnValue;
  }
  
}
