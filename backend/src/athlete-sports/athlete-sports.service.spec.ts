import { Test, TestingModule } from '@nestjs/testing';
import { AthleteSportsService } from './athlete-sports.service';

describe('AthleteSportsService', () => {
  let service: AthleteSportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AthleteSportsService],
    }).compile();

    service = module.get<AthleteSportsService>(AthleteSportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
