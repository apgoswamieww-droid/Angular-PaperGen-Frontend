import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-class-student-report',
  imports: [RouterLink, Icon],
  templateUrl: './class-student-report.html',
  styleUrl: './class-student-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassStudentReport {}
