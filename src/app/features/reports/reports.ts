import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, type IconName } from '../../shared/icon/icon';

interface ReportCard {
  title: string;
  description: string;
  icon: IconName;
  path: string;
  soon?: boolean;
}

@Component({
  selector: 'app-reports',
  imports: [RouterLink, Icon],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {
  protected readonly reports: ReportCard[] = [
    {
      title: 'Class & Student',
      description: 'Class-wise strength, section split and student rosters at a glance.',
      icon: 'users',
      path: '/reports/class-students',
    },
  ];
}
