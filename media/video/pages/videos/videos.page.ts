import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '@/auth/services/auth.service';
import { CourseProgressService } from '@/course/services/course-progress.service';
import { ActiveTask } from '@/course/interfaces/active-task.interface';
import { VideoPlaylistComponent } from '@/media/video/components/playlist/video-playlist.component';
import { environment } from '@environments/environment';
import { ToastService } from '@services/toast.service';
import { VideoService } from '../../services/video.service';
import { VideoItem } from '../../interfaces/video-item.interface';

@Component({
  selector: 'app-videos-page',
  standalone: true,
  templateUrl: './videos.page.html',
  styleUrls: ['./videos.page.scss'],
  imports: [CommonModule, IonicModule, VideoPlaylistComponent]
})
export class VideosPage implements OnInit, OnDestroy {
  videos: VideoItem[] = [];
  categoryId: string | number | null = null;
  current = 0;
  loading = true;
  error: string | null = null;
  hasFullAccess = false;
  loggedIn = false;
  showAccessNotice = true;
  activeTask: ActiveTask | null = null;
  hasActiveTask = false;
  checked = false;
  readonly showTestFinish = !environment.production;
  private routeSubscription?: { unsubscribe: () => void };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoService: VideoService,
    private auth: AuthService,
    private progress: CourseProgressService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      this.categoryId = params.get('category_id');
      this.current = Number(params.get('index') ?? 0);
      void this.load();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  get currentVideo(): VideoItem | null {
    return this.videos[this.current] ?? null;
  }

  get accessNoticeText(): string {
    if (!this.loggedIn) {
      return 'Du er ikke logget ind. Log ind for at se flere videoer og gemme dine forløb.';
    }

    return 'Opgrader til PRO for at få adgang til alle videoer.';
  }

  get showLoginLink(): boolean {
    return !this.loggedIn;
  }

  get canStartCourse(): boolean {
    return !!this.currentVideo && !this.isIntro(this.currentVideo) && !this.activeTask && !this.hasActiveTask;
  }

  get canFinishTask(): boolean {
    return !!this.activeTask && !this.checked;
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      this.loggedIn = await this.auth.isLoggedin();
      if (this.loggedIn) {
        await this.auth.refreshUser();
      } else {
        await this.auth.getUser();
      }
      this.hasFullAccess = this.auth.hasPlan(1);
      this.showAccessNotice = !this.hasFullAccess;
      this.videos = await this.videoService.getVideos(this.categoryId, this.hasFullAccess);
      await this.refreshTaskState();
    } catch (error) {
      console.error(error);
      this.error = 'Videoerne kunne ikke hentes lige nu.';
      this.videos = [];
    } finally {
      this.loading = false;
    }
  }

  async setCurrent(index: number): Promise<void> {
    this.current = Math.max(0, Math.min(index, this.videos.length - 1));
    await this.refreshTaskState();
  }

  startCourse(): void {
    void this.router.navigate(['/course/start'], {
      queryParams: {
        category_id: this.categoryId,
        index: this.current
      }
    });
  }

  async finishTask(): Promise<void> {
    const task = await this.progress.getActiveTask(this.categoryId, this.current);

    if (!task) {
      await this.refreshTaskState();
      return;
    }

    await this.progress.setTaskDone(this.categoryId, this.current, true);
    this.checked = true;
    await this.toast.success('Godt arbejde 🎉\nDu har fuldført dagens opgave.\nKom tilbage i morgen for næste skridt i forløbet.');

    if (this.progress.isTaskPeriodComplete(task)) {
      await this.router.navigate(['/course/stop'], {
        queryParams: {
          category_id: this.categoryId,
          days: task.days
        }
      });
      return;
    }

    await this.refreshTaskState();
  }

  async triggerTestFinish(): Promise<void> {
    const days = this.activeTask?.days ?? 1;
    await this.toast.success('Godt arbejde 🎉\nDu har fuldført dagens opgave.\nKom tilbage i morgen for næste skridt i forløbet.');

    await this.router.navigate(['/course/stop'], {
      queryParams: {
        category_id: this.categoryId,
        days
      }
    });
  }

  private async refreshTaskState(): Promise<void> {
    this.activeTask = await this.progress.getActiveTask(this.categoryId, this.current);
    this.hasActiveTask = await this.progress.hasAnyActiveTask();
    this.checked = await this.progress.isTaskDoneToday(this.categoryId, this.current);
  }

  private isIntro(video: VideoItem): boolean {
    return video.tags?.includes('intro') ?? false;
  }
}
