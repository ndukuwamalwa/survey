import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';
import { environment } from 'src/environments/environment';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { PortalComponent } from './portal/portal.component';
import { PanelMenuModule } from 'primeng/panelmenu';
import { QuestionComponent } from './question/question.component';
import { QuestionResponseComponent } from './question-response/question-response.component';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { UploadComponent } from './upload/upload.component';
import { SamplingComponent } from './sampling/sampling.component';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { AuthGuard } from './guards/auth.guard';
import { ChartModule } from 'primeng/chart';

@NgModule({
  declarations: [
    AppComponent,
    PortalComponent,
    QuestionComponent,
    QuestionResponseComponent,
    LoginComponent,
    UploadComponent,
    SamplingComponent
  ],
  imports: [
    BrowserModule,
    ToolbarModule,
    ButtonModule,
    TableModule,
    DialogModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ToastModule,
    ConfirmDialogModule,
    DropdownModule,
    FormsModule,
    PanelMenuModule,
    MessageModule,
    InputTextModule,
    DividerModule,
    CardModule,
    ChartModule,
    RouterModule.forRoot([
      {
        path: '',
        component: LoginComponent
      },
      {
        path: 'survey-questions',
        component: QuestionComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'upload-data',
        component: UploadComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'survey-responses',
        component: QuestionResponseComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'generate-sample',
        component: SamplingComponent,
        canActivate: [AuthGuard]
      }
    ])
  ],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink) => ({
        cache: new InMemoryCache(),
        link: httpLink.create({
          uri: environment.graphqlServer,
        })
      }),
      deps: [HttpLink],
    },
    MessageService,
    ConfirmationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
