import { Component, OnInit } from '@angular/core';
import { MenuItem, PrimeIcons } from 'primeng/api';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.css']
})
export class PortalComponent implements OnInit {
  items: Array<MenuItem> = [];

  constructor() { }

  ngOnInit(): void {
    this.items = [
      {
        label: 'Survey Questions',
        icon: PrimeIcons.QUESTION,
        routerLink: '/survey-questions'
      },
      {
        label: 'Upload Data',
        icon: PrimeIcons.UPLOAD,
        routerLink: '/upload-data'
      },
      {
        label: 'Generate Sample',
        icon: PrimeIcons.COG,
        routerLink: '/generate-sample'
      },
      {
        label: 'Survey Responses',
        icon: PrimeIcons.COMMENT,
        routerLink: '/survey-responses'
      }
    ];
  }

}
