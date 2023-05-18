import got, { HTTPError } from 'got';
import * as cheerio from 'cheerio';
import { FormDataEncoder } from 'form-data-encoder';
import { FormData } from 'formdata-node';
import { Log } from '@/utils/general';
interface UdecProps {
  username: string;
  password: string;
  token?: string;
}

export class UdecInfoda {
  private user: string;

  private pass: string;

  private formData: FormData;

  private cookies!: string[];

  private infodaUrl!: string;

  private succesAuth!: boolean;

  constructor({ username, password }: UdecProps) {
    this.user = username;
    this.pass = password;
    this.formData = new FormData();
    this.formData.set('name', this.user);
    this.formData.set('pass', this.pass);
    this.formData.set('form_id', 'user_login_block');
    this.succesAuth = false;
  }

  public async login(): Promise<boolean> {
    const encoder = new FormDataEncoder(this.formData);
    const loginRes = await got.post('https://alumnos.udec.cl/', {
      body: encoder.encode(),
      headers: encoder.headers,
      followRedirect: false,
    });
    const res = await got.get('https://alumnos.udec.cl/', {
      followRedirect: false,
      headers: {
        cookie: loginRes.headers['set-cookie'],
      },
    });
    const $ = cheerio.load(res.body);
    const infodaUrl = $('a')
      .filter((i, el) => $(el).text() === 'INFODA')
      .attr('href');
    if (infodaUrl === undefined) return false;
    this.cookies = loginRes.headers['set-cookie'] || [];
    this.infodaUrl = infodaUrl;
    await this.accesInfoda();
    return true;
  }

  private async accesInfoda() {
    const res = await got.get(this.infodaUrl, {
      headers: {
        cookie: this.cookies,
      },
    });
    this.cookies = res.headers['set-cookie'] || [];
    const $ = cheerio.load(res.body);
    const jUsername = $('input[name="j_username"]').val();
    const jPassword = $('input[name="j_password"]').val();
    const infodaPost = await got.post(
      'http://app4.udec.cl/infoda2/j_spring_security_check',
      {
        form: {
          j_username: jUsername as string,
          j_password: jPassword as string,
        },
        headers: {
          cookie: this.cookies,
        },
        followRedirect: false,
      },
    );
    this.cookies = infodaPost.headers['set-cookie'] || [];
    this.succesAuth = true;
  }
}
