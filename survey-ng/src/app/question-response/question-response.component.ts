import { Component, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { MessageService } from 'primeng/api';
import { RawData, Survey, SurveySummary } from '../model';
import { GET_RAW_DATA, GET_SURVEYS, GET_SURVEY_SUMMARY } from '../queries';

@Component({
  selector: 'app-question-response',
  templateUrl: './question-response.component.html',
  styleUrls: ['./question-response.component.css']
})
export class QuestionResponseComponent implements OnInit {
  rawData: Array<RawData> = [];
  isFetchingRaw = false;
  selectedRaw: RawData = undefined as any;
  isFetchingSurveys = false;
  surveys: Array<Survey> = [];
  selectedSurvey: Survey = undefined as any;
  isGettingSamples = false;
  selectedAreaName: 'Constituency' | 'C.A.W' | '' = '';
  details: Array<SurveySummary> = [];
  basicOptions = {
    legend: {
      labels: {
        fontColor: '#495057'
      }
    },
    scales: {
      xAxes: [{
        ticks: {
          fontColor: '#495057'
        }
      }],
      yAxes: [{
        ticks: {
          fontColor: '#495057'
        }
      }]
    }
  };
  basicData: any;
  selectedSummary: SurveySummary = undefined as any;

  constructor(
    private apollo: Apollo,
    private messageService: MessageService
  ) {
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

    this.basicData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'], // Areas
      datasets: [
        {
          label: 'My First dataset',
          backgroundColor: '#42A5F5',
          data: [65, 59, 80, 81, 56, 55, 40]// Choices
        },
        {
          label: 'My Second dataset',
          backgroundColor: '#FFA726',
          data: [28, 48, 40, 19, 86, 27, 90]
        }
      ]
    };
  }

  ngOnInit(): void {
  }

  onRawSelected(): void {
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

}
