import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, type IconName } from '../../shared/icon/icon';

@Component({
  selector: 'app-master-page',
  imports: [RouterLink, Icon],
  templateUrl: './master-page.html',
  styleUrl: './master-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterPage {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly icon = input<IconName>('database');
}
