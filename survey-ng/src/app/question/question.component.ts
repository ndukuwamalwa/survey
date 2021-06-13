import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import { ConfirmationService, MessageService, PrimeIcons } from 'primeng/api';
import { GraphQLEssentials } from '../essentials';
import { Question } from '../model';
import { GET_QUESTIONS_QUERY } from '../queries';

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css']
})
export class QuestionComponent implements OnInit {
  showAddQuestion = false;
  questions: Array<Question> = [];
  isUpdate = false;
  question: Question = undefined as any;
  saving = false;

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

  saveQuestion(form: NgForm): void {
    let mutation: DocumentNode;
    if (this.isUpdate) {
      mutation = gql`mutation m($desc: String!) {
        updateQuestion(description: $desc, code: ${this.question.code}) {
          success
          message
        }
      }`;
    } else {
      mutation = gql`mutation m($desc: String!) {
        addQuestion(description: $desc) {
          success
          message
        }
      }`;
    }
    this.apollo.mutate({
      mutation,
      refetchQueries: [{
        query: GET_QUESTIONS_QUERY
      }],
      variables: {
        desc: form.value.description
      }
    })
      .subscribe(res => {
        const result = GraphQLEssentials.handleMutationResponse(res, this.isUpdate ? 'updateQuestion' : 'addQuestion');
        if (result.success) {
          this.showAddQuestion = false;
          form.reset();
        }
        this.messageService.add(result.message);
      });
  }

  editQuestion(quiz: Question): void {
    this.isUpdate = true;
    this.question = quiz;
    this.showAddQuestion = true;
  }

  deleteQuestion(quiz: Question): void {
    this.question = quiz;
    this.confirmationService.confirm({
      message: `Are sure you want to delete question "${quiz.description}"?`,
      header: `Confirm Delete Question`,
      icon: PrimeIcons.EXCLAMATION_TRIANGLE,
      accept: () => {
        this.apollo.mutate({
          mutation: gql`mutation m {
            deleteQuestion(code: ${quiz.code}) {
              success
              message
            }
          }`,
          refetchQueries: [{
            query: GET_QUESTIONS_QUERY
          }]
        })
          .subscribe(res => {
            const result = GraphQLEssentials.handleMutationResponse(res, 'deleteQuestion');
            this.messageService.add(result.message);
          });
      }
    });
  }

  openAddQuestion(): void {
    this.showAddQuestion = true; 
    this.isUpdate = false; 
    this.question = undefined as any;
  }

}
