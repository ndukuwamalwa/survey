import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { GraphQLEssentials } from '../essentials';
import { AuthGuard } from '../guards/auth.guard';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  errorMessage = '';
  isError = false;
  loading = false;

  constructor(
    private apollo: Apollo,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  login({ username, password }: { username: string, password: string }): void {
    this.loading = true;
    this.isError = false;
    this.errorMessage = '';
    this.apollo.mutate({
      mutation: gql`mutation m {
        login(username: "${username}", password: "${password}") {
          success
          message
          token
        }
      }`
    })
      .subscribe(res => {
        this.loading = false;
        const result = GraphQLEssentials.handleMutationResponse(res, 'login');
        if (result.success) {
          const token = (res.data as any).login.token;
          sessionStorage.setItem(AuthGuard.SESS_TOKEN_KEY, token);
          this.router.navigate(['upload-data']);
        } else {
          this.isError = true;
          this.errorMessage = (res.data as any).login.message;
        }
      }, err => {
        this.loading = false;
        this.errorMessage = `Connectivity Error`;
      });
  }

  onFieldTouch() {
    if (this.isError) {
      this.isError = false;
    }
  }

}
