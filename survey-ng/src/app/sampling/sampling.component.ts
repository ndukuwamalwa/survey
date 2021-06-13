import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GraphQLEssentials } from '../essentials';
import { Survey, SurveySummary } from '../model';
import { GET_SURVEYS, GET_SURVEY_SUMMARY } from '../queries';

@Component({
  selector: 'app-sampling',
  templateUrl: './sampling.component.html',
  styleUrls: ['./sampling.component.css']
})
export class SamplingComponent implements OnInit {
  surveys: Array<Survey> = [];
  isSampling = false;
  isSendingSMS = false;
  isFetchingSurveys = false;
  selectedSurvey: Survey = undefined as any;
  details: Array<SurveySummary> = [];
  isGettingSamples = false;

  constructor(
    private apollo: Apollo,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.isFetchingSurveys = true;
    this.apollo.watchQuery({
      query: GET_SURVEYS,
      fetchPolicy: 'network-only'
    })
      .valueChanges
      .subscribe(res => {
        this.isFetchingSurveys = false;
        if (res.data) {
          this.surveys = (res.data as any).surveys;
        }
      }, err => {
        this.isFetchingSurveys = false;
      });
  }

  sample(survey: Survey): void {
    this.confirmationService.confirm({
      header: `Sample Data?`,
      message: `Are you sure you want to sample survey of ${survey.records} records and question "${survey.question}"?`,
      accept: () => {
        this.isSampling = true;
        this.apollo.mutate({
          mutation: gql`mutation m {
            sampleData(code: ${survey.code}) {
              message
              success
            }
          }`,
          refetchQueries: [{
            query: GET_SURVEYS
          }]
        })
          .subscribe(res => {
            this.isSampling = false;
            const result = GraphQLEssentials.handleMutationResponse(res, 'sampleData');
            this.messageService.add(result.message);
          }, err => {
            this.isSampling = false;
          });
      }
    });
  }

  sendSMS(survey: Survey): void {
    this.confirmationService.confirm({
      header: `SMS Survey?`,
      message: `Are you sure you want to send survey to ${survey.sampes} respondents and question "${survey.question}"?`,
      accept: () => {
        this.isSendingSMS = true;
        this.apollo.mutate({
          mutation: gql`mutation m {
            sendSMS(code: ${survey.code}) {
              message
              success
            }
          }`,
          refetchQueries: [{
            query: GET_SURVEYS
          }]
        })
          .subscribe(res => {
            this.isSendingSMS = false;
            const result = GraphQLEssentials.handleMutationResponse(res, 'sendSMS');
            this.messageService.add(result.message);
          }, err => {
            this.isSendingSMS = false;
          });
      }
    });
  }

  onSurveySelected(): void {
    this.isGettingSamples = true;
    this.apollo.query({
      query: GET_SURVEY_SUMMARY(this.selectedSurvey.code),
      fetchPolicy: 'network-only'
    })
    .subscribe(res => {
      this.isGettingSamples = false;
      if (res.data) {
        this.details = (res.data as any).survey.summary;
      }
    }, err => {
      this.isGettingSamples = false;
    });
  }

}
