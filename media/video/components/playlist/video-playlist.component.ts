import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { LoadingComponent } from '@/ui/loading/loading.component';
import { VideoItem } from '../../interfaces/video-item.interface';
import { VideoPlayerComponent } from '../player/video-player.component';

@Component({
  selector: 'app-video-playlist',
  standalone: true,
  templateUrl: './video-playlist.component.html',
  styleUrls: ['./video-playlist.component.scss'],
  imports: [CommonModule, IonicModule, RouterLink, LoadingComponent, VideoPlayerComponent]
})
export class VideoPlaylistComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() videos: VideoItem[] = [];
  @Input() current = 0;
  @Input() loading = true;
  @Input() error: string | null = null;
  @Input() showAccessNotice = false;
  @Input() accessNoticeText = '';
  @Input() showLoginLink = false;
  @Input() canStartCourse = false;
  @Input() canFinishTask = false;
  @Input() showTestFinish = false;
  @Output() currentChange = new EventEmitter<number>();
  @Output() closeAccessNotice = new EventEmitter<void>();
  @Output() startCourseRequested = new EventEmitter<void>();
  @Output() finishTaskRequested = new EventEmitter<void>();
  @Output() testFinishRequested = new EventEmitter<void>();
  @ViewChild('track') track?: ElementRef<HTMLElement>;
  @ViewChildren('dotButton', { read: ElementRef }) dotButtons?: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChildren(VideoPlayerComponent) players?: QueryList<VideoPlayerComponent>;
  dragging = false;

  private pointerId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffset = 0;
  private dotsSubscription?: Subscription;

  ngAfterViewInit(): void {
    this.dotsSubscription = this.dotButtons?.changes.subscribe(() => {
      this.scrollActiveDotIntoView('auto');
    });

    queueMicrotask(() => {
      this.scrollActiveDotIntoView('auto');
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['current'] || changes['videos']) {
      queueMicrotask(() => {
        this.resetDrag();
        this.scrollActiveDotIntoView('smooth');
      });
    }
  }

  ngOnDestroy(): void {
    this.dotsSubscription?.unsubscribe();
  }

  get currentVideo(): VideoItem | null {
    return this.videos[this.current] ?? null;
  }

  get slideTransform(): string {
    return `translate3d(calc(${-100 * this.current}% + ${this.dragOffset}px), 0, 0)`;
  }

  goTo(index: number): void {
    if (!this.videos.length) {
      return;
    }

    const next = Math.max(0, Math.min(index, this.videos.length - 1));
    if (next !== this.current) {
      this.players?.get(this.current)?.stop();
    }

    this.currentChange.emit(next);
    queueMicrotask(() => this.scrollDotIntoView(next, 'smooth'));
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.videos.length) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    this.pointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragOffset = 0;
    this.dragging = true;
    target.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
      this.endDrag(event);
      return;
    }

    if (Math.abs(deltaX) > 6) {
      event.preventDefault();
    }

    const atStart = this.current === 0 && deltaX > 0;
    const atEnd = this.current === this.videos.length - 1 && deltaX < 0;
    this.dragOffset = atStart || atEnd ? deltaX * 0.24 : deltaX;
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    const deltaX = event.clientX - this.dragStartX;
    const threshold = Math.min(120, Math.max(48, (this.track?.nativeElement.clientWidth ?? 320) * 0.16));
    const next = Math.abs(deltaX) >= threshold
      ? this.current + (deltaX < 0 ? 1 : -1)
      : this.current;

    this.endDrag(event);
    this.goTo(next);
  }

  private resetDrag(): void {
    this.dragOffset = 0;
  }

  private endDrag(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    this.pointerId = null;
    this.dragOffset = 0;
    this.dragging = false;
  }

  private scrollActiveDotIntoView(behavior: ScrollBehavior): void {
    this.scrollDotIntoView(this.current, behavior);
  }

  private scrollDotIntoView(index: number, behavior: ScrollBehavior): void {
    const dot = this.dotButtons?.get(index)?.nativeElement;
    if (!dot) {
      return;
    }

    dot.scrollIntoView({
      behavior,
      block: 'nearest',
      inline: 'center'
    });
  }
}
