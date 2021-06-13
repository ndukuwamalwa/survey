import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { ConfirmationService, MessageService, PrimeIcons } from 'primeng/api';
import * as xlsx from "xlsx";
import { Question, SurveyData } from '../model';
import { GET_QUESTIONS_QUERY } from '../queries';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  loading = false;
  dialogHeader = '';
  dialogMessage = '';
  showDialog = false;
  uploadedData: Array<SurveyData> = [];
  isSaving = false;
  questions: Array<Question> = [];
  selectedQuestion: Question = undefined as any;

  constructor(
    private apollo: Apollo,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.apollo.watchQuery({
      query: GET_QUESTIONS_QUERY
    })
      .valueChanges
      .subscribe(res => {
        if (res.data) {
          this.questions = (res.data as any).questions;
        }
      });
  }

  showSelectFile(): void {
    document.getElementById('file')?.click();
  }

  private toggleDialog(title: string, message: string): void {
    this.dialogMessage = message;
    this.dialogHeader = title;
    this.showDialog = true;
  }

  onFileSelected(target: EventTarget | null): void {
    const input = target as HTMLInputElement;
    const files = input.files as FileList;
    if (files.length === 0) {
      return;
    }
    const types = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'.toLowerCase(),
      'application/vnd.ms-excel'.toLowerCase(),
      'application/json'.toLowerCase()
    ];
    const file = files[0];
    if (!types.includes(file.type.toLowerCase())) {
      this.toggleDialog('Error', 'Invalid File Type. Only CSV, JSON and MS Excel Allowed');
      return;
    }

    const template = file;
    if (!template) {
      return this.toggleDialog('No File', 'No File Processed');
    };
    this.loading = true;
    const reader = new FileReader();
    const excel = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'.toLowerCase() === file.type.toLowerCase();
    reader.onload = (e) => {
      const records: Array<SurveyData> = [];
      if (true) {
        const data = xlsx.read(e.target?.result, { type: excel ? 'buffer' : 'string' });
        const sheet = data.Sheets[Object.keys(data.Sheets)[0]];
        if (!sheet) {
          this.loading = false;
          return this.toggleDialog('Error', 'Failed to read worksheets in the file');
        }
        const getValue = (cell: string) => {
          if (sheet[cell]) {
            if (sheet[cell].w) {
              return sheet[cell].w;
            }
            if (sheet[cell].v) {
              return sheet[cell].v;
            }
          }
          return '';
        };
        let count = 2;
        while (sheet[`A${count}`] !== undefined) {
          const record: SurveyData = {
            county: getValue(`A${count}`),
            constituency: getValue(`B${count}`),
            area: getValue(`C${count}`),
            pollingStation: getValue(`D${count}`),
            dob: getValue(`E${count}`),
            firstname: getValue(`F${count}`),
            middlename: getValue(`G${count}`),
            surname: getValue(`H${count}`),
            gender: getValue(`I${count}`),
            phone: getValue(`J${count}`),
            idPassport: getValue(`K${count}`)
          };
          if (this.isValidRow(record)) {
            records.push(record);
          }
          count++;
        }
      }
      this.uploadedData = records;
      this.loading = false;
    };
    if (excel) {
      reader.readAsArrayBuffer(template);
    } else {
      reader.readAsText(template);
    }
  }

  isValidRow(record: SurveyData): boolean {
    const line = Object.values(record).join('').trim();
    return line.length > 0;
  }

  saveUpload(): void {
    if (this.uploadedData.length === 0) {
      this.toggleDialog('No Records', 'Please upload the records.');
      return;
    }
    if (!this.selectedQuestion) {
      this.toggleDialog(`No Survey Question`, 'Select a survey question first');
      return;
    }
    this.confirmationService.confirm({
      icon: PrimeIcons.EXCLAMATION_TRIANGLE,
      header: 'Save Data?',
      message: `Are you sure you want to save data with question "${this.selectedQuestion.description}"?`,
      accept: () => {
        this.isSaving = true;
        const data = this.uploadedData;
        this.apollo.mutate({
          mutation: gql`mutation m($data: [SurveySampleInput!]!) {
            uploadData(data: $data, question: ${this.selectedQuestion.code}) {
                success
                message
              }
            }`,
          errorPolicy: 'all',
          variables: {
            data
          }
        })
          .subscribe(res => {
            this.isSaving = false;
            if (res.data) {
              const result: { message: string, success: boolean } = (res.data as any).uploadData;
              if (!result.success) {
                this.toggleDialog(`Message Sending Failed`, result.message);
              } else {
                this.uploadedData = [];
                this.selectedQuestion = undefined as any;
                this.messageService.add({ severity: 'success', summary: 'Upload Saved Successfully.', detail: result.message });
              }
            }
          }, err => {
            this.isSaving = false;
            this.toggleDialog(`Upload Error`, err.message);
          });
      }
    });
  }

}
