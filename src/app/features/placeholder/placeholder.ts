import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, type IconName } from '../../shared/icon/icon';

@Component({
  selector: 'app-placeholder',
  imports: [RouterLink, Icon],
  templateUrl: './placeholder.html',
  styleUrl: './placeholder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Placeholder {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly icon = input<IconName>('layers');
  readonly backLink = input('/dashboard');
}
