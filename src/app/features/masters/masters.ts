import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, type IconName } from '../../shared/icon/icon';

interface MasterCard {
  title: string;
  description: string;
  icon: IconName;
  path: string;
}

@Component({
  selector: 'app-masters',
  imports: [RouterLink, Icon],
  templateUrl: './masters.html',
  styleUrl: './masters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Masters {
  protected readonly masters: MasterCard[] = [
    {
      title: 'Mediums',
      description: 'Languages of instruction offered by your school.',
      icon: 'globe',
      path: '/masters/mediums',
    },
    {
      title: 'Standards',
      description: 'Class standards (grades) from pre-primary to higher secondary.',
      icon: 'layers',
      path: '/masters/standards',
    },
    {
      title: 'Subjects',
      description: 'Subjects taught and the standards they map to.',
      icon: 'grid',
      path: '/masters/subjects',
    },
    {
      title: 'Chapters',
      description: 'Syllabus chapters mapped to each subject.',
      icon: 'file-text',
      path: '/masters/chapters',
    },
    {
      title: 'Topics',
      description: 'Topic breakdown inside every chapter.',
      icon: 'list',
      path: '/masters/topics',
    },
    {
      title: 'Question Types',
      description: 'MCQ, fill in the blanks, short and long answer formats.',
      icon: 'help-circle',
      path: '/masters/question-types',
    },
    {
      title: 'Difficulty Levels',
      description: 'Easy, medium and hard levels for balanced papers.',
      icon: 'chart',
      path: '/masters/difficulty-levels',
    },
    {
      title: 'Bloom Levels',
      description: "Bloom's taxonomy levels for cognitive coverage.",
      icon: 'target',
      path: '/masters/bloom-levels',
    },
  ];
}
