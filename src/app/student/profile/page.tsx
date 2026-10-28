'use client';

import * as React from 'react';
import { CheckCircle2, ImageUp, Save, User } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { celebrate } from '@/lib/celebrate';

type MeUser = {
  id: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

const AVATAR_MAX_BYTES = 3 * 1024 * 1024;
const AVATAR_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

export default function StudentProfilePage() {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [fieldError, setFieldError] = React.useState('');

  React.useEffect(() => {
    api<{ user: MeUser }>('/api/auth/me')
      .then((data) => {
        setName(data.user.name || '');
        setPhone(data.user.phone || '');
        setAvatarUrl(data.user.avatarUrl || null);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const uploadAvatar = async (file: File) => {
    setFieldError('');
    setError('');
    setSuccess('');
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!AVATAR_EXTENSIONS.includes(ext)) {
      setFieldError('صيغة الصورة غير مدعومة (PNG / JPG / WEBP)');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setFieldError('حجم الصورة يجب أن يكون 3 ميجابايت كحد أقصى');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || 'تعذر رفع الصورة');
      setAvatarUrl(data.url);
      setSuccess('تم رفع الصورة — اضغط «حفظ التغييرات» لتطبيقها مع كلمة المرور الحالية');
    } catch (err) {
      setFieldError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setFieldError('');

    if (newPassword && newPassword !== confirmPassword) {
      setFieldError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setFieldError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setSaving(true);
    try {
      await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          phone,
          avatarUrl: avatarUrl ?? '',
          currentPassword,
          ...(newPassword ? { newPassword } : {}),
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      celebrate();
      setSuccess('تم حفظ التغييرات بنجاح ✅');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-950">ملفي الشخصي</h1>
        <p className="mt-1 text-ink-500">حدّث بياناتك وكلمة المرور</p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-4 py-3 text-sm text-ember-600"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mb-6 flex items-center gap-2 rounded-xl border border-lime-500/25 bg-lime-500/[0.08] px-4 py-3 text-sm text-brand-700">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-ink-400">جارٍ تحميل بياناتك...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* الصورة الشخصية */}
          <Card>
            <CardHeader>
              <CardTitle>الصورة الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-gold-400/25 bg-gold-400/15">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="الصورة الشخصية" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-gold-700" />
                  )}
                </div>
                {uploading ? (
                  <span className="absolute inset-0 flex items-center justify-center rounded-3xl bg-[#06110d]/35 text-xs text-gold-800">
                    جارٍ الرفع...
                  </span>
                ) : null}
              </div>
              <Label
                htmlFor="avatar-input"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gold-500/25 bg-white/60 px-4 py-2.5 text-sm font-bold text-ink-900 transition duration-300 hover:border-gold-400/45 hover:bg-gold-500/[0.08]"
              >
                <ImageUp className="h-4 w-4" />
                اختيار صورة جديدة
              </Label>
              <input
                id="avatar-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAvatar(file);
                  event.target.value = '';
                }}
              />
              <p className="text-xs text-ink-400">
                PNG أو JPG أو WEBP — بحد 3 ميجابايت
              </p>
            </CardContent>
          </Card>

          {/* بيانات الحساب */}
          <Card>
            <CardHeader>
              <CardTitle>بيانات الحساب</CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={save}>
                <FormField>
                  <Label htmlFor="profile-name">الاسم</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="اسمك الكامل"
                    maxLength={100}
                  />
                </FormField>
                <FormField>
                  <Label htmlFor="profile-phone">رقم الهاتف</Label>
                  <Input
                    id="profile-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="مثال: 01012345678"
                    maxLength={20}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField>
                    <Label htmlFor="profile-current">كلمة المرور الحالية *</Label>
                    <Input
                      id="profile-current"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder="تأكيد هويتك"
                      autoComplete="current-password"
                      required
                    />
                  </FormField>
                  <FormField>
                    <Label htmlFor="profile-new">كلمة المرور الجديدة (اختياري)</Label>
                    <Input
                      id="profile-new"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="8 أحرف على الأقل — حرف ورقم"
                      autoComplete="new-password"
                    />
                  </FormField>
                </div>
                {newPassword ? (
                  <FormField>
                    <Label htmlFor="profile-confirm">تأكيد كلمة المرور الجديدة</Label>
                    <Input
                      id="profile-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="أعد كتابة كلمة المرور الجديدة"
                      autoComplete="new-password"
                    />
                  </FormField>
                ) : null}

                {fieldError ? <FormMessage>{fieldError}</FormMessage> : null}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button type="submit" disabled={saving || uploading}>
                    <Save className="h-4 w-4" />
                    {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                  <p className="text-xs text-ink-400">
                    تغيير كلمة المرور يتطلب الحرف/الرقم و8 أحرف على الأقل، ويُطلب تأكيدها إن كتبتها
                  </p>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
