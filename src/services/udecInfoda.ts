import ky from 'ky';
import * as cheerio from 'cheerio';

interface UdecProps {
  username: string;
  password: string;
  token?: string;
}

export class UdecInfoda {
  private user: string;

  private pass: string;

  private formData: FormData;

  private cookies!: string;

  private infodaUrl!: string;

  private infodaCookies!: string;

  constructor({ username, password }: UdecProps) {
    this.user = username;
    this.pass = password;
    this.formData = new FormData();
    this.formData.append('name', this.user);
    this.formData.append('pass', this.pass);
    this.formData.append('form_id', 'user_login_block');
  }

  public async login(): Promise<boolean> {
    const loginRes = await ky.post('https://alumnos.udec.cl/', {
      body: this.formData,
      redirect: 'manual',
      throwHttpErrors: false,
    });

    const res = await ky.get('https://alumnos.udec.cl/', {
      headers: {
        cookie: loginRes.headers.get('set-cookie') as string,
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const infodaUrl = $('a')
      .filter((i, el) => $(el).text() === 'INFODA')
      .attr('href');
    if (infodaUrl === undefined) return false;
    this.cookies = res.headers.get('set-cookie') as string;
    this.infodaUrl = infodaUrl;
    this.accesInfoda();
    return true;
  }

  private async accesInfoda() {
    const res = await ky.get(this.infodaUrl, {
      headers: {
        cookie: this.cookies,
      },
    });
    this.cookies = res.headers.get('set-cookie') as string;
    const html = await res.text();
    const $ = cheerio.load(html);
    const jUsername = $('input[name="j_username"]').val();
    const jPassword = $('input[name="j_password"]').val();
    const searchParams = new URLSearchParams();
    searchParams.set('j_username', (jUsername as string).replace('\n', ''));
    searchParams.set('j_password', (jPassword as string).replace('\n', ''));

    const infodaPost = await ky.post(
      'http://app4.udec.cl/infoda2/j_spring_security_check',
      {
        body: searchParams,
      },
    );
    console.log(infodaPost.headers.get('set-cookie'));
    this.infodaCookies = infodaPost.headers.get('set-cookie') as string;
  }
}
