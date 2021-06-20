import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GraphQLEssentials } from '../essentials';
import { Question, RawData, Survey, SurveySummary } from '../model';
import { GET_CONSTITUENCIES, GET_RAW_DATA, GET_SURVEYS, GET_SURVEY_SUMMARY } from '../queries';

@Component({
  selector: 'app-sampling',
  templateUrl: './sampling.component.html',
  styleUrls: ['./sampling.component.css']
})
export class SamplingComponent implements OnInit {
  surveys: Array<Survey> = [];
  isSendingSMS = false;
  isFetchingSurveys = false;
  selectedSurvey: Survey = undefined as any;
  details: Array<SurveySummary> = [];
  isGettingSamples = false;
  rawData: Array<RawData> = [];
  isFetchingRaw = false;
  selectedRaw: RawData = undefined as any;
  showAddSampling = false;
  constituencies: Array<{ name: string, wards: Array<string> }> = [];
  selectedContituency: string = undefined as any;
  questions: Array<Question> = [];
  isSavingSample = false;
  selectedAreaName: 'Constituency' | 'C.A.W' | '' = '';
  wards: Array<string> = [];
  choices: Array<string> = [];
  abcd: Array<string> = [];
  enteredQuestion = '';
  enteredChoices = '';
  orderType: 'A' | 1 | '' = '';

  constructor(
    private apollo: Apollo,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.isFetchingRaw = true;
    this.apollo.watchQuery({
      query: GET_RAW_DATA,
      fetchPolicy: 'network-only'
    })
      .valueChanges
      .subscribe(res => {
        this.isFetchingRaw = false;
        if (res.data) {
          this.rawData = (res.data as any).rawData;
        } else {
          this.messageService.add({ severity: 'error', summary: 'Fetch Error', detail: 'Failed to get uploaded data' });
        }
      }, err => {
        this.messageService.add({ severity: 'error', summary: 'Fetch Error', detail: 'Failed to get uploaded data' });
        this.isFetchingRaw = false;
      });
    for (let i = 65; i <= 90; i ++) {
      this.abcd.push(String.fromCharCode(i));
    }
  }

  addSample(form: NgForm): void {
    const constituency = form.value.constituency;
    const ward = form.value.ward || 'ALL';
    const question = form.value.question;
    this.isSavingSample = true;
    this.apollo.mutate({
      mutation: gql`mutation m($data: SampleInput!) {
            sampleData(data: $data) {
              message
              success
            }
          }`,
      refetchQueries: [{
        query: GET_SURVEYS(this.selectedRaw.code)
      }],
      variables: {
        data: {
          raw: this.selectedRaw.code,
          constituency,
          ward,
          question,
          choices: this.choices
        }
      }
    })
      .subscribe(res => {
        this.isSavingSample = false;
        const result = GraphQLEssentials.handleMutationResponse(res, 'sampleData');
        if (result.success) {
          form.reset();
          this.showAddSampling = false;
        }
        this.messageService.add(result.message);
      }, err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to complete sample' });
        this.isSavingSample = false;
      });
  }

  sendSMS(survey: Survey): void {
    this.confirmationService.confirm({
      header: `SMS Survey?`,
      message: `Are you sure you want to send survey to ${survey.samples} respondents and question "${survey.question}"?`,
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
            query: GET_SURVEYS(this.selectedRaw.code)
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
    this.selectedAreaName = this.selectedSurvey.area;
    this.apollo.watchQuery({
      query: GET_SURVEY_SUMMARY(this.selectedSurvey.code),
      fetchPolicy: 'network-only'
    })
      .valueChanges
      .subscribe(res => {
        this.isGettingSamples = false;
        if (res.data) {
          this.details = (res.data as any).survey.summary;
        }
      }, err => {
        this.isGettingSamples = false;
      });
  }

  openAddNewSampling(): void {
    this.showAddSampling = true;
  }

  onRawSelected(): void {
    this.apollo.query({
      fetchPolicy: 'network-only',
      query: GET_CONSTITUENCIES(this.selectedRaw.code)
    })
      .subscribe(res => {
        if (res.data) {
          this.constituencies = (res.data as any).rawConstituencies;
        }
      });
    this.isFetchingSurveys = true;
    this.apollo.watchQuery({
      query: GET_SURVEYS(this.selectedRaw.code),
      fetchPolicy: 'network-only'
    })
      .valueChanges
      .subscribe(res => {
        this.isFetchingSurveys = false;
        if (res.data) {
          this.surveys = (res.data as any).surveys;
        } else {
          this.messageService.add({ summary: 'Fetch Error', detail: 'Failed to get surveys', severity: 'error' });
        }
      }, err => {
        this.isFetchingSurveys = false;
        this.messageService.add({ summary: 'Fetch Error', detail: 'Failed to get surveys', severity: 'error' });
      });
  }

  onConstituencySelected(target: EventTarget | null): void {
    const select: HTMLSelectElement = target as any;
    const data = this.constituencies.find(v => v.name === select.value) as any;
    if (data) {
      this.wards = data.wards;
      this.selectedContituency = data;
    } else {
      this.wards = [];
      this.selectedContituency = undefined as any;
    }
  }

  getChoices(): Array<string> {
    let choices = this.enteredChoices;
    if (!choices) {
      choices = '';
    }
    if (choices.trim().length === 0) {
      return [];
    }
    choices = choices.trim();
    const parts = choices.split(',').map((v, i) => {
      if (this.orderType === 'A') {
        return this.abcd[i] + '.' + v;
      } else {
        return (i + 1) + '.' + v;
      }
    });

    return parts;
  }

  onQuestionInput() {
    this.choices = this.getChoices();
  }

  onChoiceInput() {
    this.choices = this.getChoices();
  }

  onOrderTypeChange() {
    this.choices = this.getChoices();
  }

}
